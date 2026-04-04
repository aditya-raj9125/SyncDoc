'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '@syncdoc/utils';
import { Avatar } from '@/components/ui/Avatar';
import { STRINGS } from '@/lib/constants';
import { FileText, Share2 } from 'lucide-react';
import { DocumentActions } from './DocumentActions';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Workspace, Document, Profile } from '@syncdoc/types';

interface SharedWithMeContentProps {
  workspace: Workspace;
  profile: Profile;
  email: string;
  onRefresh?: () => void;
}

type SharedDoc = Document & {
  owner?: { display_name: string; avatar_url: string | null; avatar_color: string };
};

export function SharedWithMeContent(props: SharedWithMeContentProps) {
  const {
    workspace,
    profile,
    email,
    onRefresh,
  } = props;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [documents, setDocuments] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const basePath = `/workspace/${workspace.slug}`;

  useEffect(() => {
    setMounted(true);
    fetchSharedDocs();
  }, [workspace.id, profile.id, email]);

  async function fetchSharedDocs() {
    setLoading(true);
    try {
      // 1. Get docs from document_permissions
      const { data: permDocs } = await supabase
        .from('document_permissions')
        .select(`
          document_id,
          documents (
            *,
            owner:profiles (*)
          )
        `)
        .eq('user_id', profile.id);

      // 2. Get docs from share_invitations (by email)
      const { data: inviteDocs } = await supabase
        .from('share_invitations')
        .select(`
          document_id,
          documents (
            *,
            owner:profiles (*)
          )
        `)
        .eq('invited_email', email);

      const allDocs = [
        ...(permDocs?.map(p => p.documents) || []),
        ...(inviteDocs?.map(i => i.documents) || [])
      ].filter(Boolean) as unknown as SharedDoc[];

      // De-duplicate by ID
      const uniqueDocs = Array.from(new Map(allDocs.map(d => [d.id, d])).values());
      // Sort by last_edited_at
      uniqueDocs.sort((a, b) => new Date(b.last_edited_at).getTime() - new Date(a.last_edited_at).getTime());
      
      setDocuments(uniqueDocs);
    } catch (err) {
      console.error('Failed to fetch shared docs:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleActionComplete = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    onRefresh?.();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
           <Share2 size={20} />
        </div>
        <h1 className="text-2xl font-semibold">Shared with me</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
             <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 rounded-full bg-[var(--bg-elevated)] p-4 text-[var(--text-tertiary)]">
            <Share2 className="h-8 w-8" />
          </div>
          <p className="text-[var(--text-secondary)] mb-1">No shared documents yet</p>
          <p className="text-sm text-[var(--text-tertiary)]">
            When others invite you or share links with you, they'll appear here.
          </p>
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

          {documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => router.push(`${basePath}/doc/${doc.id}`)}
              className="grid grid-cols-[1fr,200px,150px,40px] items-center gap-4 rounded-[var(--radius-md)] px-4 py-2 cursor-pointer hover:bg-[var(--bg-elevated)] transition-all group"
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
                      src={doc.owner.avatar_url || ''}
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
