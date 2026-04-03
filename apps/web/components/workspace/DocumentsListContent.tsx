'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatRelativeTime, getDocumentColor } from '@syncdoc/utils';
import { Avatar } from '@/components/ui/Avatar';
import { STRINGS } from '@/lib/constants';
import { FileText } from 'lucide-react';
import type { Workspace, Document } from '@syncdoc/types';

interface DocumentsListContentProps {
  workspace: Workspace;
  documents: (Document & { owner?: { display_name: string; avatar_url: string | null; avatar_color: string } })[];
  title: string;
  emptyMessage?: string;
  emptyHint?: string;
}

export function DocumentsListContent({
  workspace,
  documents,
  title,
  emptyMessage = STRINGS.workspace.noDocuments,
  emptyHint = STRINGS.workspace.noDocumentsHint,
}: DocumentsListContentProps) {
  const router = useRouter();
  const basePath = `/workspace/${workspace.slug}`;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">{title}</h1>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-[var(--bg-elevated)] p-4">
            <FileText className="h-8 w-8 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-[var(--text-secondary)] mb-1">{emptyMessage}</p>
          <p className="text-sm text-[var(--text-tertiary)]">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => router.push(`${basePath}/doc/${doc.id}`)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors group"
            >
              <span className="text-lg flex-shrink-0">{doc.emoji_icon}</span>
              <span className="flex-1 truncate text-sm font-medium">{doc.title}</span>
              {doc.owner ? (
                <Avatar
                  name={doc.owner.display_name}
                  src={doc.owner.avatar_url}
                  color={doc.owner.avatar_color}
                  size="sm"
                />
              ) : null}
              <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                {formatRelativeTime(doc.last_edited_at)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
