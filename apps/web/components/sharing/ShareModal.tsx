'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal';
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
} from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  workspace: Workspace;
}

type AccessLevel = 'view' | 'edit';

export function ShareModal({ open, onOpenChange, document: doc, workspace }: ShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkAccess, setLinkAccess] = useState<AccessLevel | 'none'>('none');
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (open) {
      loadShareSettings();
    }
  }, [open, doc.id]);

  const loadShareSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch fresh document data to get current share settings
      const { data: freshDoc, error } = await supabase
        .from('documents')
        .select('is_public, public_access')
        .eq('id', doc.id)
        .single();

      if (error) {
        console.error('Failed to load share settings:', error);
        toast.error('Failed to load sharing settings');
        return;
      }
        
      if (freshDoc) {
        // Filter out 'comment' if it somehow exists in DB
        const access = freshDoc.public_access === 'comment' ? 'view' : freshDoc.public_access;
        setLinkAccess(access === 'none' ? 'none' : (access as AccessLevel));
        setIsPublished(freshDoc.is_public);
      }
    } catch (err) {
      console.error('Error loading share settings:', err);
      toast.error('Something went wrong loading share settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Persist link access changes to Supabase
  const updatePublicAccess = useCallback(async (access: AccessLevel | 'none') => {
    try {
      const isPublic = access !== 'none';
      const { error } = await supabase
        .from('documents')
        .update({
          is_public: isPublic,
          public_access: access,
        })
        .eq('id', doc.id);

      if (error) {
        console.error('Failed to update sharing settings:', error);
        toast.error('Failed to update sharing settings');
        return;
      }
      setLinkAccess(access);
      toast.success(access === 'none' ? 'Link sharing disabled' : `Link access set to "${access}"`);
    } catch (err) {
      console.error('Error updating sharing settings:', err);
      toast.error('Something went wrong updating sharing settings');
    }
  }, [doc.id, supabase]);

  // Persist publish toggle to Supabase
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
        console.error('Failed to update publish state:', error);
        toast.error('Failed to update publish state');
        return;
      }
      setIsPublished(newPublished);
      if (!newPublished) setLinkAccess('none');
      toast.success(newPublished ? 'Document published' : 'Document unpublished');
    } catch (err) {
      console.error('Error toggling publish:', err);
      toast.error('Something went wrong updating publish state');
    }
  }, [doc.id, isPublished, supabase]);

  const handleCopyLink = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="wide">
        <ModalHeader>
          <ModalTitle>Share</ModalTitle>
        </ModalHeader>
      <Tabs.Root defaultValue="link" className="w-full">
        <Tabs.List className="flex border-b border-[var(--bg-border)] mb-4">
          <Tabs.Trigger
            value="link"
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--text-secondary)] border-b-2 border-transparent data-[state=active]:text-[var(--brand-primary)] data-[state=active]:border-[var(--brand-primary)]"
          >
            <Link2 size={14} />
            Share link
          </Tabs.Trigger>
          <Tabs.Trigger
            value="publish"
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--text-secondary)] border-b-2 border-transparent data-[state=active]:text-[var(--brand-primary)] data-[state=active]:border-[var(--brand-primary)]"
          >
            <Globe size={14} />
            Publish
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab 1: Share Link */}
        <Tabs.Content value="link" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-primary)]">Anyone with the link can...</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Share this link with people outside your workspace
              </p>
            </div>
            <select
              value={linkAccess}
              onChange={(e) => updatePublicAccess(e.target.value as AccessLevel | 'none')}
              disabled={isLoading}
              className="rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-50"
            >
              <option value="none">No access</option>
              <option value="view">Can view</option>
              <option value="edit">Can edit</option>
            </select>
          </div>

          {linkAccess !== 'none' && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2.5">
              <Link2 size={14} className="flex-shrink-0 text-[var(--text-tertiary)]" />
              <span className="flex-1 truncate text-sm text-[var(--text-secondary)]">
                {window.location.origin}/share/{doc.share_token || 'generating...'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => handleCopyLink(`${window.location.origin}/share/${doc.share_token}`)}>
                {linkCopied ? (
                  <><Check size={14} className="mr-1 text-green-500" /> Copied</>
                ) : (
                  <><Copy size={14} className="mr-1" /> Copy</>
                )}
              </Button>
            </div>
          )}
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
                  {window.location.origin}/pub/{doc.share_token || 'generating...'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyLink(`${window.location.origin}/pub/${doc.share_token}`)}
                >
                  <Copy size={14} />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <Shield size={12} />
                <span>
                  SEO enabled: title and first 200 characters will appear in search results
                </span>
              </div>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
      </ModalContent>
    </Modal>
  );
}
