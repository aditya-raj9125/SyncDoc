'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreVertical,
  Star,
  Share2,
  FileDown,
  FileText,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/Dropdown';
import { ShareModal } from '@/components/sharing/ShareModal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';
import type { Document, Workspace } from '@syncdoc/types';

interface DocumentActionsProps {
  document: Document;
  workspace: Workspace;
  isStarred?: boolean;
  isTrash?: boolean;
  onActionComplete?: () => void;
}

export function DocumentActions({
  document: doc,
  workspace,
  isStarred: initialIsStarred = false,
  isTrash = false,
  onActionComplete,
}: DocumentActionsProps) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(initialIsStarred);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const supabase = createClient();

  async function toggleStar(e: React.MouseEvent) {
    e.stopPropagation();
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
        if (error) setIsStarred(true);
        else toast.success('Removed from starred');
      } else {
        setIsStarred(true);
        const { error } = await supabase
          .from('starred_documents')
          .insert({ document_id: doc.id, user_id: user.id });
        if (error) setIsStarred(false);
        else toast.success('Added to starred');
      }
      onActionComplete?.();
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to move this document to trash?')) return;

    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', doc.id);

    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Moved to trash');
      onActionComplete?.();
    }
  }

  async function handleRestore(e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: null })
      .eq('id', doc.id);

    if (error) {
      toast.error('Failed to restore document');
    } else {
      toast.success('Document restored');
      onActionComplete?.();
    }
  }

  async function handlePermanentDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('This document will be permanently deleted. This action cannot be undone. Area you sure?')) return;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);

    if (error) {
      toast.error('Failed to delete document permanently');
    } else {
      toast.success('Document permanently deleted');
      onActionComplete?.();
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    setShareModalOpen(true);
  }

  async function handleDownload(e: React.MouseEvent, type: 'pdf' | 'docx') {
    e.stopPropagation();
    toast.info(`Preparing ${type.toUpperCase()}...`);

    try {
      // Find the editor element
      const editorElement = document.querySelector('.tiptap-editor');
      if (!editorElement) {
        toast.error('Editor content not found');
        return;
      }

      const fileName = `${doc.title || 'Untitled'}.${type}`;

      if (type === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        // Capture the editor content
        const canvas = await html2canvas(editorElement as HTMLElement, {
          scale: 2, // Higher quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (documentClone) => {
            // Hide any elements we don't want in the PDF
            const noPrintElements = documentClone.querySelectorAll('.no-print');
            noPrintElements.forEach((el) => ((el as HTMLElement).style.display = 'none'));
          },
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2], // Match canvas size roughly
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(fileName);
        toast.success(`PDF downloaded: ${fileName}`);
      } else {
        // DOCX Export using existing library
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        const { saveAs } = await import('file-saver');

        // Simple text-based DOCX for now (full HTML-to-DOCX is a complex plugin)
        // We can get the text from the DOM or Tiptap if we had the editor instance.
        // Since we are in DocumentActions, we'll pull from the DOM.
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
        saveAs(blob, fileName);
        toast.success(`Word document downloaded: ${fileName}`);
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export document');
    }
  }

  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="More actions"
          >
            <MoreVertical size={16} />
          </button>
        </DropdownTrigger>
        <DropdownContent align="end" className="w-48">
          {isTrash ? (
            <>
              <DropdownItem onSelect={(e) => handleRestore(e as any)}>
                <RotateCcw size={14} className="mr-2" />
                Restore
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onSelect={(e) => handlePermanentDelete(e as any)}
                className="text-red-500 hover:text-red-600 focus:text-red-600"
              >
                <Trash2 size={14} className="mr-2" />
                Delete Permanently
              </DropdownItem>
            </>
          ) : (
            <>
              <DropdownItem onSelect={(e) => toggleStar(e as any)}>
                <Star size={14} className="mr-2" fill={isStarred ? 'currentColor' : 'none'} color={isStarred ? 'var(--brand-primary)' : 'currentColor'} />
                {isStarred ? 'Unstar' : 'Star'}
              </DropdownItem>
              <DropdownItem onSelect={(e) => handleShare(e as any)}>
                <Share2 size={14} className="mr-2" />
                Share
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onSelect={(e) => handleDownload(e as any, 'pdf')}>
                <FileDown size={14} className="mr-2" />
                Download PDF
              </DropdownItem>
              <DropdownItem onSelect={(e) => handleDownload(e as any, 'docx')}>
                <FileText size={14} className="mr-2" />
                Download Word
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onSelect={(e) => handleDelete(e as any)}
                className="text-red-500 hover:text-red-600 focus:text-red-600"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownItem>
            </>
          )}
        </DropdownContent>
      </Dropdown>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        document={doc}
        workspace={workspace}
      />
    </>
  );
}
