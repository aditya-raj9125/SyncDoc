'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, FileText as FileTextIcon } from 'lucide-react';
import * as Y from 'yjs';
import mammoth from 'mammoth';
import { STRINGS } from '@/lib/constants';
import { getGreeting, formatRelativeTime, getReadingTime, formatWordCount, getDocumentColor } from '@syncdoc/utils';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DocumentCardSkeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase/client';
import { DocumentActions } from './DocumentActions';
import { toast } from '@/components/ui/Toast';
import type { Workspace, Profile, Document } from '@syncdoc/types';

interface HomeContentProps {
  workspace: Workspace;
  profile: Profile;
  recentDocuments: (Document & {
    owner?: { display_name: string; avatar_url: string | null; avatar_color: string };
  })[];
  starredIds?: Set<string>;
  onRefresh?: () => void;
}

export function HomeContent({
  workspace,
  profile,
  recentDocuments: initialRecentDocs,
  starredIds = new Set(),
  onRefresh,
}: HomeContentProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [localRecentDocs, setLocalRecentDocs] = useState(initialRecentDocs);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setLocalRecentDocs(initialRecentDocs);
  }, [initialRecentDocs]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleActionComplete = (docId: string) => {
    setLocalRecentDocs((prev) => prev.filter((d) => d.id !== docId));
    onRefresh?.();
  };

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

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let content = '';
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (extension === 'txt' || extension === 'md') {
        content = await file.text();
      } else {
        toast.error(`Unsupported format: .${extension}. Please use .docx, .txt, or .md`);
        return;
      }

      // Create a Yjs document and populate it
      const ydoc = new Y.Doc();
      const ytext = ydoc.getText('default');
      ytext.insert(0, content);
      
      // Encode state as update and convert to base64 for Supabase
      const state = Y.encodeStateAsUpdate(ydoc);
      
      // Robust binary-to-base64 conversion for browser
      const base64State = btoa(
        new Uint8Array(state).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Derive title from filename
      const title = file.name.replace(/\.(docx?|txt|md|rtf)$/i, '') || 'Untitled';

      const { data: doc, error } = await supabase
        .from('documents')
        .insert({
          workspace_id: workspace.id,
          owner_id: user.id,
          title,
          source_type: 'upload',
          ydoc_state: base64State,
        })
        .select()
        .single();

      if (!error && doc) {
        toast.success(`Uploaded "${title}" successfully`);
        router.push(`${basePath}/doc/${doc.id}`);
      } else {
        console.error('Database insertion error:', error);
        toast.error('Failed to save uploaded document');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to read or convert the file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header with Greeting and Theme Toggle */}
      <div className="flex items-center justify-between mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold"
        >
          {mounted ? greeting : `Welcome, ${profile.display_name}`}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ThemeToggle />
        </motion.div>
      </div>

      {/* Action Cards — New Document + Upload Document */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-4 mb-10 max-w-md"
      >
        {/* New Document */}
        <button
          onClick={handleNewDocument}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--bg-border)] bg-[var(--bg-surface)] p-6 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)]/20 transition-colors">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            New document
          </span>
        </button>

        {/* Upload Document */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--bg-border)] bg-[var(--bg-surface)] p-6 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer disabled:opacity-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)]/20 transition-colors">
            <Upload className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            {uploading ? 'Uploading...' : 'Upload document'}
          </span>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt,.md"
          onChange={handleUploadDocument}
          className="hidden"
          aria-label="Upload document file"
        />
      </motion.div>

      {/* Recent documents */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
          {STRINGS.workspace.recentDocuments}
        </h2>

        {localRecentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-[var(--bg-elevated)] p-4">
              <Plus className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-secondary)] mb-1">{STRINGS.workspace.noDocuments}</p>
            <p className="text-sm text-[var(--text-tertiary)]">{STRINGS.workspace.noDocumentsHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {localRecentDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2 }}
                className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] hover:shadow-md transition-all"
                onClick={() => router.push(`${basePath}/doc/${doc.id}`)}
              >
                {/* Actions Menu */}
                <div 
                  className="absolute right-1.5 top-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DocumentActions
                    document={doc}
                    workspace={workspace}
                    isStarred={starredIds.has(doc.id)}
                    onActionComplete={() => handleActionComplete(doc.id)}
                  />
                </div>

                {/* Color strip */}
                <div className="h-20 w-full" style={{ background: getDocumentColor(doc.id) }} />
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
                    <span>{mounted ? formatRelativeTime(doc.last_edited_at) : 'recently'}</span>
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
