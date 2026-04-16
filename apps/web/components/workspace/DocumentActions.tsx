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
      if (!user) {
        toast.error('You must be signed in to star a document');
        return;
      }

      if (isStarred) {
        setIsStarred(false);
        const { error } = await supabase
          .from('starred_documents')
          .delete()
          .eq('document_id', doc.id)
          .eq('user_id', user.id);
        if (error) {
          setIsStarred(true);
          toast.error('Failed to remove star');
        } else {
          toast.success('Removed from starred');
        }
      } else {
        setIsStarred(true);
        const { error } = await supabase
          .from('starred_documents')
          .insert({ document_id: doc.id, user_id: user.id });
        if (error) {
          setIsStarred(false);
          toast.error('Failed to star document');
        } else {
          toast.success('Added to starred');
        }
      }
      onActionComplete?.();
    } catch (err) {
      console.error('Error toggling star:', err);
      toast.error('Something went wrong');
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to move this document to trash?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', doc.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete document');
      } else {
        toast.success('Moved to trash');
        onActionComplete?.();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Something went wrong while deleting');
    }
  }

  async function handleRestore(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: null })
        .eq('id', doc.id);

      if (error) {
        console.error('Restore error:', error);
        toast.error('Failed to restore document');
      } else {
        toast.success('Document restored');
        onActionComplete?.();
      }
    } catch (err) {
      console.error('Error restoring document:', err);
      toast.error('Something went wrong while restoring');
    }
  }

  async function handlePermanentDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('This document will be permanently deleted. This action cannot be undone. Are you sure?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) {
        console.error('Permanent delete error:', error);
        toast.error('Failed to delete document permanently');
      } else {
        toast.success('Document permanently deleted');
        onActionComplete?.();
      }
    } catch (err) {
      console.error('Error permanently deleting document:', err);
      toast.error('Something went wrong');
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
      // Try to find editor DOM element (works when document is open in editor)
      const editorElement = document.querySelector('.tiptap-editor');
      
      if (!editorElement) {
        // If not on editor page, navigate to the document first
        toast.info('Opening document for export...');
        router.push(`/workspace/${workspace.slug}/doc/${doc.id}`);
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

        const text = editorElement.textContent || '';
        const lines = text.split('\n').filter(l => l.trim() !== '');

        if (lines.length === 0) {
          toast.error('Document is empty — nothing to export');
          return;
        }

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
      toast.error(`Failed to export ${type.toUpperCase()}. Please open the document and try again.`);
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
