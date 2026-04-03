'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { DocumentRevision } from '@syncdoc/types';

interface UseRevisionsOptions {
  documentId: string;
  enabled?: boolean;
}

export function useRevisions({ documentId, enabled = true }: UseRevisionsOptions) {
  const [revisions, setRevisions] = useState<DocumentRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  const fetchRevisions = useCallback(async () => {
    if (!enabled || !documentId) return;
    setLoading(true);

    const { data } = await supabase
      .from('document_revisions')
      .select('*, profiles(display_name, avatar_url, avatar_color)')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    setRevisions(data || []);
    setLoading(false);
  }, [documentId, enabled]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const createSnapshot = useCallback(
    async (label?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Get current document state
      const { data: doc } = await supabase
        .from('documents')
        .select('ydoc_state, word_count')
        .eq('id', documentId)
        .single();

      if (!doc) return null;

      const { data, error } = await supabase
        .from('document_revisions')
        .insert({
          document_id: documentId,
          ydoc_snapshot: doc.ydoc_state,
          word_count: doc.word_count || 0,
          created_by: user.id,
          label: label || 'Manual save',
        })
        .select('*, profiles(display_name, avatar_url, avatar_color)')
        .single();

      if (error) return null;
      if (data) setRevisions((prev) => [data, ...prev]);
      return data;
    },
    [documentId]
  );

  const restoreRevision = useCallback(
    async (revisionId: string) => {
      const revision = revisions.find((r) => r.id === revisionId);
      if (!revision) return false;

      const { error } = await supabase
        .from('documents')
        .update({
          ydoc_state: revision.ydoc_snapshot,
          last_edited_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return !error;
    },
    [documentId, revisions]
  );

  return { revisions, loading, createSnapshot, restoreRevision, refetch: fetchRevisions };
}
