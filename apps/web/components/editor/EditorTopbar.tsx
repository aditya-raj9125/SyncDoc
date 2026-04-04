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
} from 'lucide-react';

interface EditorTopbarProps {
  document: Document;
  workspace: Workspace;
  profile: Profile;
}

export function EditorTopbar({ document: doc, workspace, profile }: EditorTopbarProps) {
  const router = useRouter();
  const { wordCount, isSaving, focusMode, toggleFocusMode, connectionStatus } = useEditorStore();
  const { setShareModalOpen } = useUIStore();
  const users = usePresenceStore((s) => s.users);
  const [isStarred, setIsStarred] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const supabase = createClient();

  const readingTime = getReadingTime(wordCount);
  const localClientId = usePresenceStore((s) => s.localClientId);
  
  // Filter out local user from the display list
  const otherUsers = Array.from(users.entries())
    .filter(([clientId]) => clientId !== localClientId)
    .map(([, state]) => state);

  const presenceUsers = otherUsers.slice(0, 5);
  const overflowCount = Math.max(0, otherUsers.length - 5);

  useEffect(() => {
    async function checkStarred() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('starred_documents')
        .select('id')
        .eq('document_id', doc.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsStarred(!!data);
    }
    checkStarred();
  }, [doc.id, supabase]);

  async function toggleStar() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (isStarred) {
        setIsStarred(false);
        const { error } = await supabase
          .from('starred_documents')
          .delete()
          .eq('document_id', doc.id)
          .eq('user_id', user.id);
        if (error) setIsStarred(true);
      } else {
        setIsStarred(true);
        const { error } = await supabase
          .from('starred_documents')
          .insert({ document_id: doc.id, user_id: user.id });
        if (error) setIsStarred(false);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  }

  // ---- Action Handlers ----

  async function handleExportPDF() {
    toast.info('Preparing PDF...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Target only the editor content (ProseMirror), excluding title and UI
      const editorElement = document.querySelector('.tiptap-editor');
      if (!editorElement) {
        toast.error('Editor content not found');
        return;
      }

      const canvas = await html2canvas(editorElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${doc.title || 'Untitled'}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF');
    }
  }

  async function handleExportDOCX() {
    toast.info('Preparing DOCX...');
    try {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const { saveAs } = await import('file-saver');

      const editorElement = document.querySelector('.tiptap-editor');
      if (!editorElement) {
        toast.error('Editor content not found');
        return;
      }

      // Simple text-based DOCX (content only, no title header)
      const text = editorElement.textContent || '';
      const lines = text.split('\n').filter(l => l.trim() !== '');

      const docxObj = new Document({
        sections: [
          {
            properties: {},
            children: lines.map(line => new Paragraph({
              children: [new TextRun(line)],
              spacing: { before: 200 },
            })),
          },
        ],
      });

      const blob = await Packer.toBlob(docxObj);
      saveAs(blob, `${doc.title || 'Untitled'}.docx`);
      toast.success('Word document downloaded');
    } catch (err) {
      console.error('DOCX export error:', err);
      toast.error('Failed to export Word document');
    }
  }

  async function handleDuplicate() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
      .select()
      .single();

    if (!error && newDoc) {
      router.push(`/workspace/${workspace.slug}/doc/${newDoc.id}`);
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this document?')) return;
    const { error } = await supabase
      .from('documents')
      .update({ status: 'archived' })
      .eq('id', doc.id);

    if (!error) {
      router.push(`/workspace/${workspace.slug}/home`);
    }
  }

  async function handleDelete() {
    if (!confirm('Move this document to trash?')) return;
    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', doc.id);

    if (!error) {
      router.push(`/workspace/${workspace.slug}/home`);
    }
  }

  const connectionDot = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
    synced: 'bg-blue-500',
  }[connectionStatus as string] || 'bg-gray-500';

  return (
    <div className="flex items-center justify-between border-b border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 h-12 no-print">
      {/* Left: back + status */}
      <div className="flex items-center gap-3">
        <Tooltip content="Back to workspace">
          <button
            onClick={() => router.push(`/workspace/${workspace.slug}/home`)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Back to workspace"
          >
            <ArrowLeft size={16} />
          </button>
        </Tooltip>

        {/* Star */}
        <Tooltip content={isStarred ? 'Remove from starred' : 'Add to starred'}>
          <button
            onClick={toggleStar}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] transition-colors hover:bg-[var(--bg-elevated)]"
            aria-label={isStarred ? 'Unstar document' : 'Star document'}
          >
            <Star
              size={16}
              fill={isStarred ? 'var(--brand-primary)' : 'none'}
              color={isStarred ? 'var(--brand-primary)' : 'var(--text-secondary)'}
            />
          </button>
        </Tooltip>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
          <div className={`h-2 w-2 rounded-full ${connectionDot}`} />
          <span>{connectionStatus}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Word count / reading time */}
        <span className="mr-2 text-xs text-[var(--text-tertiary)]">
          {formatWordCount(wordCount)} · {readingTime} min read
        </span>

        {/* Collaborators */}
        {presenceUsers.length > 0 && (
          <div className="mr-4 flex -space-x-2 transition-all">
            {presenceUsers.map((u, idx) => {
              const userProfile = u.user;
              const name = userProfile?.name || 'Anonymous';
              const color = userProfile?.color || 'var(--brand-primary)';
              const initials = getInitials(name);

              return (
                <Tooltip key={`${userProfile?.id || idx}`} content={name}>
                  <div 
                    className="relative transition-transform hover:-translate-y-1 hover:z-10"
                    style={{ zIndex: presenceUsers.length - idx }}
                  >
                    <div className="rounded-full border-2 border-[var(--bg-surface)] bg-[var(--bg-surface)]">
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



        <Tooltip content={focusMode ? 'Exit focus mode' : 'Focus mode'}>
          <button
            onClick={toggleFocusMode}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Toggle focus mode"
          >
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </Tooltip>

        {/* Share button */}
        <Button size="sm" onClick={() => setShareModalOpen(true)}>
          <Share2 size={14} className="mr-1.5" />
          Share
        </Button>

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
          <DropdownItem onSelect={handleDuplicate}>
            <Copy size={14} />
            Duplicate
          </DropdownItem>
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
