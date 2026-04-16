'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { usePresenceStore } from '@/store/presenceStore';
import { formatWordCount, getReadingTime, getInitials, getAvatarColor } from '@syncdoc/utils';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';
import { MoveToFolderModal } from '@/components/workspace/MoveToFolderModal';
import type { Document, Workspace, Profile } from '@syncdoc/types';
import type { AccessLevel } from '@/lib/permissions';
import {
  ArrowLeft,
  Share2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  FileDown,
  FileText,
  Printer,
  Copy,
  FolderInput,
  Archive,
  Trash2,
  Star,
  ChevronRight,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';

interface EditorTopbarProps {
  document: Document;
  workspace: Workspace;
  profile: Profile;
  accessLevel?: AccessLevel;
}

export function EditorTopbar({ document: doc, workspace, profile, accessLevel = 'owner' }: EditorTopbarProps) {
  const router = useRouter();
  const { wordCount, isSaving, focusMode, toggleFocusMode, connectionStatus } = useEditorStore();
  const { setShareModalOpen } = useUIStore();
  const users = usePresenceStore((s) => s.users);
  const [isStarred, setIsStarred] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const supabase = createClient();

  const readingTime = getReadingTime(wordCount);
  const localClientId = usePresenceStore((s) => s.localClientId);

  // Derive permission flags from accessLevel
  const isOwner = accessLevel === 'owner';
  const canEdit = accessLevel === 'edit' || accessLevel === 'owner';
  const canShare = isOwner;
  const canModifyDoc = isOwner;

  // Filter out local user from the display list
  const otherUsers = Array.from(users.entries())
    .filter(([clientId]) => clientId !== localClientId)
    .map(([, state]) => state);

  const presenceUsers = otherUsers.slice(0, 5);
  const overflowCount = Math.max(0, otherUsers.length - 5);

  useEffect(() => {
    async function checkStarred() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('starred_documents')
          .select('id')
          .eq('document_id', doc.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsStarred(!!data);
      } catch (err) {
        console.error('Error checking starred status:', err);
      }
    }
    checkStarred();
  }, [doc.id]);

  async function toggleStar() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isStarred) {
        setIsStarred(false);
        const { error } = await supabase
          .from('starred_documents')
          .delete()
          .eq('document_id', doc.id)
          .eq('user_id', user.id);
        if (error) { setIsStarred(true); toast.error('Failed to remove star'); }
      } else {
        setIsStarred(true);
        const { error } = await supabase
          .from('starred_documents')
          .insert({ document_id: doc.id, user_id: user.id });
        if (error) { setIsStarred(false); toast.error('Failed to star document'); }
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  }

  // ---- Action Handlers ----

  // FIX 6: PDF export using correct A4 pagination
  async function handleExportPDF() {
    toast.info('Preparing PDF...');
    try {
      const { exportToPdf } = await import('@/lib/export/toPdf');
      const editorElement = document.querySelector('.tiptap-editor') as HTMLElement | null;
      if (!editorElement) {
        toast.error('Editor content not found');
        return;
      }
      await exportToPdf(editorElement, doc.title || 'Untitled');
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF. Please try again.');
    }
  }

  // FIX 7/8: DOCX export using properly typed ProseMirror JSON walker + named saveAs import
  async function handleExportDOCX() {
    toast.info('Preparing DOCX...');
    try {
      const { exportToDocx, downloadDocx } = await import('@/lib/export/toDocx');
      // Get ProseMirror JSON from the editor element's data attribute (set by Tiptap)
      const editorElement = document.querySelector('.tiptap-editor');
      if (!editorElement) {
        toast.error('Editor content not found');
        return;
      }

      // Use Tiptap extension getJSON via a global reference, or fall back to DOM text extraction
      // Try to find the editor instance from the store
      const store = (await import('@/store/editorStore')).useEditorStore.getState();

      // Get JSON from tiptap editor via global editor ref or fall back to text content
      let proseMirrorJson: Record<string, unknown> = { type: 'doc', content: [] };
      
      // Attempt to get editor JSON from window-level editor ref (set in Editor.tsx)
      if ((window as any).__tiptapEditor) {
        proseMirrorJson = (window as any).__tiptapEditor.getJSON();
      }

      if (!proseMirrorJson.content || (proseMirrorJson.content as any[]).length === 0) {
        // Fallback: parse text content into simple paragraphs
        const text = editorElement.textContent || '';
        const lines = text.split('\n').filter(l => l.trim() !== '');
        proseMirrorJson = {
          type: 'doc',
          content: lines.map(line => ({
            type: 'paragraph',
            content: [{ type: 'text', text: line }]
          }))
        };
      }

      const blob = await exportToDocx(proseMirrorJson, {
        title: doc.title || 'Untitled',
        author: profile.display_name,
      });
      await downloadDocx(blob, `${doc.title || 'Untitled'}.docx`);
      toast.success('Word document downloaded');
    } catch (err) {
      console.error('DOCX export error:', err);
      toast.error('Failed to export Word document. Please try again.');
    }
  }

  async function handleDuplicate() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You must be signed in to duplicate a document'); return; }

      const { data: newDoc, error } = await supabase
        .from('documents')
        .insert({
          workspace_id: doc.workspace_id,
          folder_id: doc.folder_id,
          title: `${doc.title} (copy)`,
          emoji_icon: doc.emoji_icon,
          owner_id: user.id,
          source_type: 'blank',
          ydoc_state: doc.ydoc_state,
          content: (doc as any).content,
        })
        .select('id')
        .single();

      if (error) { toast.error('Failed to duplicate document'); return; }
      if (newDoc) {
        toast.success('Document duplicated');
        router.push(`/workspace/${workspace.slug}/doc/${newDoc.id}`);
      }
    } catch (err) {
      toast.error('Something went wrong while duplicating');
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this document?')) return;
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'archived' })
        .eq('id', doc.id);
      if (error) { toast.error('Failed to archive document'); return; }
      toast.success('Document archived');
      router.push(`/workspace/${workspace.slug}/home`);
    } catch (err) {
      toast.error('Something went wrong while archiving');
    }
  }

  async function handleDelete() {
    if (!confirm('Move this document to trash?')) return;
    try {
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', doc.id);
      if (error) { toast.error('Failed to move document to trash'); return; }
      toast.success('Moved to trash');
      router.push(`/workspace/${workspace.slug}/home`);
    } catch (err) {
      toast.error('Something went wrong while deleting');
    }
  }

  // FIX 11: Connection status as refined pill
  const connectionConfig = {
    connected: { color: 'bg-green-500', label: 'Live', textClass: 'text-green-600 dark:text-green-400' },
    synced: { color: 'bg-blue-500', label: 'Synced', textClass: 'text-blue-600 dark:text-blue-400' },
    connecting: { color: 'bg-amber-500 animate-pulse', label: 'Syncing', textClass: 'text-amber-600 dark:text-amber-400' },
    disconnected: { color: 'bg-red-500', label: 'Offline', textClass: 'text-red-600 dark:text-red-400' },
  }[connectionStatus as string] || { color: 'bg-gray-400', label: connectionStatus, textClass: 'text-[var(--text-tertiary)]' };

  return (
    <div className="flex items-center justify-between border-b border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 h-12 no-print">

      {/* FIX 11: LEFT ZONE — back button + breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
        <Tooltip content="Back to workspace">
          <button
            onClick={() => router.push(`/workspace/${workspace.slug}/home`)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Back to workspace"
          >
            <ArrowLeft size={16} />
          </button>
        </Tooltip>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] min-w-0">
          <span className="truncate max-w-[100px] font-medium">{workspace.name}</span>
          <ChevronRight size={12} className="flex-shrink-0" />
          <span className="truncate max-w-[140px] text-[var(--text-secondary)] font-medium">
            {doc.emoji_icon} {doc.title || 'Untitled'}
          </span>
        </div>

        {/* Star */}
        <Tooltip content={isStarred ? 'Remove from starred' : 'Add to starred'}>
          <button
            onClick={toggleStar}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors hover:bg-[var(--bg-elevated)]"
            aria-label={isStarred ? 'Unstar document' : 'Star document'}
          >
            <Star
              size={14}
              fill={isStarred ? 'var(--brand-primary)' : 'none'}
              color={isStarred ? 'var(--brand-primary)' : 'var(--text-tertiary)'}
            />
          </button>
        </Tooltip>
      </div>

      {/* FIX 11: CENTER ZONE — refined connection status pill */}
      <div className="flex items-center justify-center flex-shrink-0">
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-[var(--bg-elevated)] ${connectionConfig.textClass}`}>
          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${connectionConfig.color}`} />
          <span className="text-[11px] font-medium whitespace-nowrap">{connectionConfig.label}</span>
          {isSaving && <Loader2 size={10} className="animate-spin ml-0.5" />}
        </div>
      </div>

      {/* FIX 11: RIGHT ZONE — word count + presence + share + more */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Word count */}
        <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap hidden sm:block">
          {formatWordCount(wordCount)} words
        </span>

        {/* Collaborators */}
        {presenceUsers.length > 0 && (
          <div className="flex -space-x-1.5">
            {presenceUsers.map((u, idx) => {
              const userProfile = u.user;
              const name = userProfile?.name || 'Anonymous';
              const color = userProfile?.color || 'var(--brand-primary)';
              return (
                <Tooltip key={`${userProfile?.id || idx}`} content={name}>
                  <div
                    className="relative transition-transform hover:-translate-y-0.5 hover:z-10"
                    style={{ zIndex: presenceUsers.length - idx }}
                  >
                    <div className="rounded-full border-2 border-[var(--bg-surface)]">
                      <Avatar
                        name={name}
                        color={color}
                        src={userProfile?.user?.avatar_url || undefined}
                        size="sm"
                      />
                    </div>
                  </div>
                </Tooltip>
              );
            })}
            {overflowCount > 0 && (
              <div className="z-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-surface)] bg-[var(--bg-elevated)] text-[10px] font-medium text-[var(--text-secondary)]">
                +{overflowCount}
              </div>
            )}
          </div>
        )}

        {/* Focus mode */}
        <Tooltip content={focusMode ? 'Exit focus mode' : 'Focus mode'}>
          <button
            onClick={toggleFocusMode}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Toggle focus mode"
          >
            {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </Tooltip>

        {/* FIX 11: Share button — filled brand color, icon+label, keyboard shortcut tooltip */}
        {canShare && (
          <Tooltip content="Share document  ⌘⇧S">
            <Button
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </Tooltip>
        )}

        {/* More options */}
        <Dropdown>
          <DropdownTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem onSelect={handleExportPDF}>
              <FileDown size={14} />
              Export as PDF
            </DropdownItem>
            <DropdownItem onSelect={handleExportDOCX}>
              <FileText size={14} />
              Export as DOCX
            </DropdownItem>
            <DropdownItem onSelect={() => window.print()}>
              <Printer size={14} />
              Print
            </DropdownItem>
            <DropdownSeparator />
            {canEdit && (
              <DropdownItem onSelect={handleDuplicate}>
                <Copy size={14} />
                Duplicate
              </DropdownItem>
            )}
            {canModifyDoc && (
              <>
                <DropdownItem onSelect={() => setMoveModalOpen(true)}>
                  <FolderInput size={14} />
                  Move to folder
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem onSelect={handleArchive}>
                  <Archive size={14} />
                  Archive
                </DropdownItem>
                <DropdownItem onSelect={handleDelete} className="text-red-600 dark:text-red-400">
                  <Trash2 size={14} />
                  Delete
                </DropdownItem>
              </>
            )}
          </DropdownContent>
        </Dropdown>
      </div>

      {/* Move to folder modal */}
      <MoveToFolderModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        documentId={doc.id}
        workspaceId={doc.workspace_id}
        currentFolderId={doc.folder_id}
        onMoved={() => router.refresh()}
      />
    </div>
  );
}
