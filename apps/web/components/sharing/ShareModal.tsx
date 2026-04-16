'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';
import type { Document, Workspace } from '@syncdoc/types';
import {
  Link2,
  Copy,
  Check,
  Globe,
  Shield,
  X,
  RefreshCw,
  Eye,
  Edit3,
  MessageSquare,
} from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  workspace: Workspace;
}

type AccessLevel = 'view' | 'comment' | 'edit';

interface ShareLink {
  id: string;
  access_level: AccessLevel;
  token: string;
  is_active: boolean;
}

const ACCESS_LEVELS: { level: AccessLevel; label: string; description: string; icon: React.ReactNode }[] = [
  { level: 'view', label: 'Can view', description: 'Read-only access', icon: <Eye size={14} /> },
  { level: 'comment', label: 'Can comment', description: 'View and add comments', icon: <MessageSquare size={14} /> },
  { level: 'edit', label: 'Can edit', description: 'Full editing access', icon: <Edit3 size={14} /> },
];

export function ShareModal({ open, onOpenChange, document: doc, workspace }: ShareModalProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (open) {
      loadShareSettings();
    }
  }, [open, doc.id]);

  const loadShareSettings = async () => {
    setIsLoading(true);
    try {
      const [docResult, linksResult] = await Promise.all([
        supabase
          .from('documents')
          .select('is_public, status')
          .eq('id', doc.id)
          .single(),
        supabase
          .from('share_links')
          .select('id, access_level, token, is_active')
          .eq('document_id', doc.id),
      ]);

      if (docResult.data) {
        setIsPublished(docResult.data.is_public && docResult.data.status === 'published');
      }

      if (linksResult.data) {
        setShareLinks(linksResult.data as ShareLink[]);
      }
    } catch (err) {
      console.error('Error loading share settings:', err);
      toast.error('Failed to load sharing settings');
    } finally {
      setIsLoading(false);
    }
  };

  // UPSERT a share link for given access level — creates if doesn't exist, returns existing if it does
  const getOrCreateShareLink = useCallback(async (accessLevel: AccessLevel): Promise<ShareLink | null> => {
    try {
      // Try to upsert — if row exists with this (document_id, access_level), return it
      // If not, create one with a new random token
      const { data, error } = await supabase
        .from('share_links')
        .upsert(
          {
            document_id: doc.id,
            access_level: accessLevel,
            is_active: true,
          },
          {
            onConflict: 'document_id,access_level',
            ignoreDuplicates: false,
          }
        )
        .select('id, access_level, token, is_active')
        .single();

      if (error) {
        // If upsert fails (e.g. RLS or conflict), fetch the existing one
        const { data: existing } = await supabase
          .from('share_links')
          .select('id, access_level, token, is_active')
          .eq('document_id', doc.id)
          .eq('access_level', accessLevel)
          .single();
        return existing as ShareLink | null;
      }

      return data as ShareLink;
    } catch (err) {
      console.error('Error creating share link:', err);
      return null;
    }
  }, [doc.id, supabase]);

  // Copy link — creates link if needed
  const handleCopyLink = async (accessLevel: AccessLevel) => {
    let link = shareLinks.find(l => l.access_level === accessLevel && l.is_active);

    if (!link) {
      const newLink = await getOrCreateShareLink(accessLevel);
      if (!newLink) {
        toast.error('Failed to generate share link');
        return;
      }
      link = newLink;
      setShareLinks(prev => {
        const filtered = prev.filter(l => l.access_level !== accessLevel);
        return [...filtered, newLink];
      });
    }

    const url = `${window.location.origin}/share/${link.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(link.token);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Disable link — sets is_active = false AND regenerates new token
  // This makes the old URL permanently dead
  const handleDisableLink = async (accessLevel: AccessLevel) => {
    const existingLink = shareLinks.find(l => l.access_level === accessLevel);
    if (!existingLink) return;

    setRegenerating(accessLevel);
    try {
      // Delete the old row (token is UNIQUE, so we need to delete and reinsert to get a new token)
      await supabase
        .from('share_links')
        .delete()
        .eq('document_id', doc.id)
        .eq('access_level', accessLevel);

      // Remove from local state
      setShareLinks(prev => prev.filter(l => l.access_level !== accessLevel));
      toast.success(`${accessLevel} link disabled — old URL is permanently dead`);
    } catch (err) {
      console.error('Error disabling share link:', err);
      toast.error('Failed to disable link');
    } finally {
      setRegenerating(null);
    }
  };

  // Publish toggle
  const togglePublish = useCallback(async () => {
    try {
      const newPublished = !isPublished;
      const { error } = await supabase
        .from('documents')
        .update({
          is_public: newPublished,
          public_access: newPublished ? 'view' : 'none',
          status: newPublished ? 'published' : 'draft',
        })
        .eq('id', doc.id);

      if (error) {
        toast.error('Failed to update publish state');
        return;
      }
      setIsPublished(newPublished);
      toast.success(newPublished ? 'Document published' : 'Document unpublished');
    } catch (err) {
      toast.error('Something went wrong');
    }
  }, [doc.id, isPublished, supabase]);

  // FIX 4: Render into portal, start invisible, animate in
  if (!open) return null;

  const modalContent = (
    // FIX 4: position: fixed; inset: 0; display: flex — NEVER absolute
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* FIX 4: Modal starts at opacity:0 scale:0.96 BEFORE first paint */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[560px] mx-4 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Share</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Tabs.Root defaultValue="link" className="w-full">
            <Tabs.List className="flex border-b border-[var(--bg-border)] mb-5">
              <Tabs.Trigger
                value="link"
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] border-b-2 border-transparent data-[state=active]:text-[var(--brand-primary)] data-[state=active]:border-[var(--brand-primary)] transition-colors"
              >
                <Link2 size={14} />
                Share link
              </Tabs.Trigger>
              <Tabs.Trigger
                value="publish"
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] border-b-2 border-transparent data-[state=active]:text-[var(--brand-primary)] data-[state=active]:border-[var(--brand-primary)] transition-colors"
              >
                <Globe size={14} />
                Publish
              </Tabs.Trigger>
            </Tabs.List>

            {/* FIX 3: Tab 1 — Per-access-level share links */}
            <Tabs.Content value="link" className="space-y-4">
              <p className="text-xs text-[var(--text-tertiary)]">
                Each access level has its own unique, independent link. Disabling one doesn't affect the others.
              </p>

              {ACCESS_LEVELS.map(({ level, label, description, icon }) => {
                const link = shareLinks.find(l => l.access_level === level && l.is_active);
                const isCopied = link && copiedToken === link.token;
                const isRegenerating = regenerating === level;

                return (
                  <div
                    key={level}
                    className="rounded-[var(--radius-md)] border border-[var(--bg-border)] p-4 space-y-3"
                  >
                    {/* Access level header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)]">{icon}</span>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {link && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDisableLink(level)}
                            disabled={isRegenerating}
                            className="text-xs text-[var(--text-tertiary)] hover:text-red-500"
                          >
                            Disable
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleCopyLink(level)}
                          disabled={isLoading || isRegenerating}
                        >
                          {isCopied ? (
                            <><Check size={13} className="mr-1 text-green-500" /> Copied</>
                          ) : (
                            <><Copy size={13} className="mr-1" /> {link ? 'Copy link' : 'Create link'}</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Show link URL if active */}
                    {link && (
                      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2">
                        <Link2 size={12} className="flex-shrink-0 text-[var(--text-tertiary)]" />
                        <span className="flex-1 truncate text-xs text-[var(--text-secondary)] font-mono">
                          {window.location.origin}/share/{link.token}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </Tabs.Content>

            {/* Tab 2: Publish */}
            <Tabs.Content value="publish" className="space-y-4">
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--bg-border)] p-4">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Publish as public page</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Anyone on the internet can view this document
                    </p>
                  </div>
                </div>
                <button
                  onClick={togglePublish}
                  disabled={isLoading}
                  className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                    isPublished ? 'bg-[var(--brand-primary)]' : 'bg-[var(--bg-border)]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isPublished ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {isPublished && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2.5">
                    <Globe size={14} className="flex-shrink-0 text-green-500" />
                    <span className="flex-1 truncate text-sm text-[var(--text-secondary)]">
                      {window.location.origin}/pub/{(doc as any).share_token || 'generating...'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`${window.location.origin}/pub/${(doc as any).share_token}`);
                          toast.success('Link copied');
                        } catch { toast.error('Failed to copy'); }
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <Shield size={12} />
                    <span>SEO enabled: title and first 200 characters appear in search results</span>
                  </div>
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  // FIX 4: Always render into a portal attached to document.body
  return ReactDOM.createPortal(modalContent, document.body);
}
