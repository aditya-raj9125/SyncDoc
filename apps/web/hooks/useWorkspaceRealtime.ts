'use client';

import { useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useWorkspaceStore, type DocumentWithOwner } from '@/store/workspaceStore';
import { toast } from '@/components/ui/Toast';
import type { Folder } from '@syncdoc/types';

interface UseWorkspaceRealtimeOptions {
  workspaceId: string;
  userId: string;
}

const MAX_BACKOFF_MS = 30_000;

/**
 * FIX 12 — useWorkspaceRealtime hook (production-hardened)
 *
 * Key constraints of Supabase Realtime postgres_changes:
 * - `filter` only works with equality on indexed columns present IN that table
 * - `starred_documents` has no workspace_id → can't use workspace filter
 * - `document_permissions` has no workspace_id → same issue
 * - Mixing invalid filters causes CHANNEL_ERROR / TIMED_OUT immediately
 *
 * Solution:
 * - Use ONE channel per subscription scope (avoids multi-channel overhead)
 * - Only filter on columns that actually exist in each table
 * - Filter client-side for cross-table concerns (e.g. only act on current user's rows)
 * - Simple subscriptions — no complex OR / AND filter expressions
 */
export function useWorkspaceRealtime({ workspaceId, userId }: UseWorkspaceRealtimeOptions) {
  const supabase = createBrowserClient();
  const {
    mergeDocument,
    removeDocument,
    mergeFolder,
    removeFolder,
    addSharedDocument,
    setDocuments,
    setSharedDocuments,
    setFolders,
    setStarredIds,
    addStarred,
    removeStarred,
  } = useWorkspaceStore();

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timedOutCountRef = useRef(0); // Count consecutive TIMED_OUT to detect Realtime not enabled
  const MAX_AUTO_RETRIES = 5; // Stop infinite reconnect loop if Realtime isn't configured

  useEffect(() => {
    async function doFullRefresh() {
      try {
        const [docsResult, foldersResult, starredResult] = await Promise.all([
          supabase
            .from('documents')
            .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
            .eq('workspace_id', workspaceId)
            .eq('owner_id', userId)
            .is('deleted_at', null)
            .order('last_edited_at', { ascending: false }),
          supabase
            .from('folders')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('position'),
          supabase
            .from('starred_documents')
            .select('document_id')
            .eq('user_id', userId),
        ]);

        if (docsResult.data) setDocuments(docsResult.data as DocumentWithOwner[]);
        if (foldersResult.data) setFolders(foldersResult.data as Folder[]);
        if (starredResult.data) {
          setStarredIds(new Set(starredResult.data.map((s: any) => s.document_id)));
        }
      } catch (err) {
        console.error('[WorkspaceRealtime] Full refresh failed:', err);
      }
    }

    function subscribe() {
      // Clean up previous channel before creating a new one
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channelName = `workspace-${workspaceId}`;

      const channel = supabase
        .channel(channelName)

        // ───────────────────────────────────────────────
        // DOCUMENTS — filter by workspace_id (exists on table) ✓
        // ───────────────────────────────────────────────
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'documents',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            const updated = payload.new as any;
            // Soft-delete: deleted_at was set → remove from store
            if (updated.deleted_at) {
              removeDocument(updated.id);
              return;
            }
            // Archived → remove from active docs
            if (updated.status === 'archived') {
              removeDocument(updated.id);
              return;
            }
            mergeDocument(updated as DocumentWithOwner);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'documents',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            const newDoc = payload.new as DocumentWithOwner;
            // Only add to store if it's owned by current user
            // (shared docs come in via document_permissions subscription)
            if ((newDoc as any).owner_id === userId) {
              mergeDocument(newDoc);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'documents',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            removeDocument((payload.old as any).id);
          }
        )

        // ───────────────────────────────────────────────
        // FOLDERS — filter by workspace_id (exists on table) ✓
        // ───────────────────────────────────────────────
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'folders',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => mergeFolder(payload.new as Folder)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'folders',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => mergeFolder(payload.new as Folder)
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'folders',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => removeFolder((payload.old as any).id)
        )

        // ───────────────────────────────────────────────
        // DOCUMENT_PERMISSIONS — NO workspace_id column!
        // Can't filter by workspace here — listen broadly,
        // filter client-side to current user only.
        // This requires Realtime enabled for document_permissions
        // in Supabase dashboard (Database → Replication).
        // ───────────────────────────────────────────────
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'document_permissions',
          },
          async (payload) => {
            const perm = payload.new as any;
            // Client-side filter: only care about permissions for current user
            if (perm.user_id !== userId) return;

            const { data: doc } = await supabase
              .from('documents')
              .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
              .eq('id', perm.document_id)
              .single();

            if (doc && (doc as any).owner_id !== userId) {
              addSharedDocument(doc as DocumentWithOwner);
              toast.info(`"${(doc as any).title}" was shared with you`);
            }
          }
        )

        // ───────────────────────────────────────────────
        // STARRED_DOCUMENTS — NO workspace_id column!
        // Listen broadly, filter client-side.
        // ───────────────────────────────────────────────
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'starred_documents',
          },
          (payload) => {
            const row = payload.new as any;
            if (row.user_id !== userId) return;
            addStarred(row.document_id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'starred_documents',
          },
          (payload) => {
            const row = payload.old as any;
            if (row.user_id !== userId) return;
            removeStarred(row.document_id);
          }
        )

        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            backoffRef.current = 1000; // Reset backoff
            timedOutCountRef.current = 0; // Reset timeout counter
            console.log('[WorkspaceRealtime] Subscribed ✓');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            timedOutCountRef.current += 1;

            if (timedOutCountRef.current >= MAX_AUTO_RETRIES) {
              console.error(
                `[WorkspaceRealtime] ${MAX_AUTO_RETRIES} consecutive failures.\n` +
                'Realtime may not be enabled for these tables in your Supabase project.\n' +
                'Go to: Supabase Dashboard → Database → Replication → supabase_realtime publication\n' +
                'Add tables: documents, folders, document_permissions, starred_documents\n' +
                'OR run: supabase db push (applies migration 00013_enable_realtime.sql)'
              );
              // Stop retrying — avoids infinite loop when Realtime is truly unconfigured
              return;
            }

            const delay = backoffRef.current;
            console.warn(`[WorkspaceRealtime] ${status} (attempt ${timedOutCountRef.current}/${MAX_AUTO_RETRIES}) — retrying in ${delay}ms`);

            reconnectTimeoutRef.current = setTimeout(() => {
              backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
              subscribe();
              doFullRefresh();
            }, delay);
          } else if (status === 'CLOSED') {
            // Normal close — don't reconnect
          }
        });

      channelRef.current = channel;
    }

    subscribe();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, userId]); // eslint-disable-line react-hooks/exhaustive-deps
}
