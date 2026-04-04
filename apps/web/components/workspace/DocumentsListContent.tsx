'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatRelativeTime, getDocumentColor } from '@syncdoc/utils';
import { Avatar } from '@/components/ui/Avatar';
import { STRINGS } from '@/lib/constants';
import { FileText } from 'lucide-react';
import { DocumentActions } from './DocumentActions';
import type { Workspace, Document } from '@syncdoc/types';

interface DocumentsListContentProps {
  workspace: Workspace;
  documents: (Document & { owner?: { display_name: string; avatar_url: string | null; avatar_color: string } })[];
  starredIds?: Set<string>;
  isTrash?: boolean;
  title: string;
  emptyMessage?: string;
  emptyHint?: string;
  onRefresh?: () => void;
}

export function DocumentsListContent({
  workspace,
  documents: initialDocuments,
  starredIds = new Set(),
  isTrash = false,
  title,
  emptyMessage = STRINGS.workspace.noDocuments,
  emptyHint = STRINGS.workspace.noDocumentsHint,
  onRefresh,
}: DocumentsListContentProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [localDocuments, setLocalDocuments] = useState(initialDocuments);
  const basePath = `/workspace/${workspace.slug}`;

  useEffect(() => {
    setLocalDocuments(initialDocuments);
  }, [initialDocuments]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleActionComplete = (docId: string) => {
    setLocalDocuments((prev) => prev.filter((d) => d.id !== docId));
    onRefresh?.();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-8">{title}</h1>

      {localDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-[var(--bg-elevated)] p-4">
            <FileText className="h-8 w-8 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-[var(--text-secondary)] mb-1">{emptyMessage}</p>
          <p className="text-sm text-[var(--text-tertiary)]">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr,200px,150px,40px] gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] border-b border-[var(--bg-border)] mb-2">
            <div>Name</div>
            <div>Owner</div>
            <div className="text-right">Last Edited</div>
            <div />
          </div>

          {localDocuments.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => router.push(`${basePath}/doc/${doc.id}`)}
              className="grid grid-cols-[1fr,200px,150px,40px] items-center gap-4 rounded-[var(--radius-md)] px-4 py-1.5 cursor-pointer hover:bg-[var(--bg-elevated)] transition-all group"
            >
              {/* Name Column */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{doc.emoji_icon}</span>
                <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {doc.title || 'Untitled'}
                </span>
              </div>

              {/* Owner Column */}
              <div className="flex items-center gap-2 min-w-0">
                {doc.owner ? (
                  <>
                    <Avatar
                      name={doc.owner.display_name}
                      src={doc.owner.avatar_url}
                      color={doc.owner.avatar_color}
                      size="sm"
                      className="!h-6 !w-6"
                    />
                    <span className="truncate text-xs text-[var(--text-secondary)]">
                      {doc.owner.display_name}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-tertiary)]">—</span>
                )}
              </div>

              {/* Date Column */}
              <div className="text-right">
                <span className="text-[11px] text-[var(--text-tertiary)] font-medium whitespace-nowrap">
                  {mounted ? formatRelativeTime(doc.last_edited_at) : 'recently'}
                </span>
              </div>

              {/* Actions Column */}
              <div 
                className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DocumentActions
                  document={doc}
                  workspace={workspace}
                  isStarred={starredIds.has(doc.id)}
                  isTrash={isTrash}
                  onActionComplete={() => handleActionComplete(doc.id)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
