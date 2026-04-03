'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Upload, LayoutTemplate, UserPlus } from 'lucide-react';
import { STRINGS } from '@/lib/constants';
import { getGreeting, formatRelativeTime, getReadingTime, formatWordCount, getDocumentColor } from '@syncdoc/utils';
import { Avatar } from '@/components/ui/Avatar';
import { DocumentCardSkeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/uiStore';
import type { Workspace, Profile, Document } from '@syncdoc/types';

interface HomeContentProps {
  workspace: Workspace;
  profile: Profile;
  recentDocuments: (Document & { owner?: { display_name: string; avatar_url: string | null; avatar_color: string } })[];
}

export function HomeContent({ workspace, profile, recentDocuments }: HomeContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const { setUploadModalOpen, setTemplateGalleryOpen } = useUIStore();

  const greeting = getGreeting(profile.display_name);
  const basePath = `/workspace/${workspace.slug}`;

  async function handleNewDocument() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspace.id,
        owner_id: user.id,
        title: 'Untitled',
        source_type: 'blank',
      })
      .select()
      .single();

    if (!error && doc) {
      router.push(`${basePath}/doc/${doc.id}`);
    }
  }

  const quickActions = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: STRINGS.workspace.newDocument,
      onClick: handleNewDocument,
      color: 'var(--brand-primary)',
    },
    {
      icon: <Upload className="h-5 w-5" />,
      label: STRINGS.workspace.uploadFile,
      onClick: () => setUploadModalOpen(true),
      color: '#10b981',
    },
    {
      icon: <LayoutTemplate className="h-5 w-5" />,
      label: STRINGS.workspace.useTemplate,
      onClick: () => setTemplateGalleryOpen(true),
      color: '#f59e0b',
    },
    {
      icon: <UserPlus className="h-5 w-5" />,
      label: STRINGS.workspace.invitePeople,
      onClick: () => {},
      color: '#ec4899',
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold mb-8"
      >
        {greeting}
      </motion.h1>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] p-5 text-sm font-medium text-[var(--text-primary)] hover:shadow-md transition-shadow"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-white"
              style={{ backgroundColor: action.color }}
            >
              {action.icon}
            </div>
            {action.label}
          </motion.button>
        ))}
      </div>

      {/* Recent documents */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
          {STRINGS.workspace.recentDocuments}
        </h2>

        {recentDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-[var(--bg-elevated)] p-4">
              <Plus className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-secondary)] mb-1">{STRINGS.workspace.noDocuments}</p>
            <p className="text-sm text-[var(--text-tertiary)]">{STRINGS.workspace.noDocumentsHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentDocuments.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2 }}
                className="group cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] hover:shadow-md transition-all"
                onClick={() => router.push(`${basePath}/doc/${doc.id}`)}
              >
                {/* Color strip */}
                <div
                  className="h-20 w-full"
                  style={{ background: getDocumentColor(doc.id) }}
                />
                {/* Content */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-base">{doc.emoji_icon}</span>
                    <span className="text-sm font-medium truncate">{doc.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                    {doc.owner ? (
                      <Avatar
                        name={doc.owner.display_name}
                        src={doc.owner.avatar_url}
                        color={doc.owner.avatar_color}
                        size="sm"
                        className="!h-4 !w-4 !text-[8px]"
                      />
                    ) : null}
                    <span>{formatRelativeTime(doc.last_edited_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
