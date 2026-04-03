'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Document, Workspace, Profile, DocumentPermission } from '@syncdoc/types';
import {
  Link2,
  Copy,
  Check,
  Globe,
  Mail,
  X,
  Shield,
  ChevronDown,
} from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  workspace: Workspace;
}

type AccessLevel = 'view' | 'comment' | 'edit';

interface Invitee {
  email: string;
  access: AccessLevel;
}

export function ShareModal({ open, onOpenChange, document: doc, workspace }: ShareModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [existingPermissions, setExistingPermissions] = useState<(DocumentPermission & { profiles?: Profile })[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkAccess, setLinkAccess] = useState<AccessLevel | 'none'>('none');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (open) {
      loadPermissions();
      loadShareLink();
    }
  }, [open, doc.id]);

  const loadPermissions = async () => {
    const { data } = await supabase
      .from('document_permissions')
      .select('*, profiles(*)')
      .eq('document_id', doc.id);
    if (data) setExistingPermissions(data);
  };

  const loadShareLink = async () => {
    // Fetch fresh document data to get current share settings
    const { data: freshDoc } = await supabase
      .from('documents')
      .select('is_public, public_access')
      .eq('id', doc.id)
      .single();
    if (freshDoc) {
      setLinkAccess(freshDoc.public_access === 'none' ? 'none' : (freshDoc.public_access as AccessLevel));
      setIsPublished(freshDoc.is_public);
    } else {
      setLinkAccess(doc.public_access === 'none' ? 'none' : (doc.public_access as AccessLevel));
      setIsPublished(doc.is_public);
    }
  };

  // Persist link access changes to Supabase
  const updatePublicAccess = useCallback(async (access: AccessLevel | 'none') => {
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
      return;
    }
    setLinkAccess(access);
  }, [doc.id, supabase]);

  // Persist publish toggle to Supabase
  const togglePublish = useCallback(async () => {
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
      return;
    }
    setIsPublished(newPublished);
    if (!newPublished) setLinkAccess('none');
  }, [doc.id, isPublished, supabase]);

  const handleAddEmail = () => {
    const emails = emailInput.split(/[,;\s]+/).filter(Boolean);
    const newInvitees = emails
      .filter((e) => e.includes('@') && !invitees.some((inv) => inv.email === e))
      .map((email) => ({ email, access: 'edit' as AccessLevel }));
    setInvitees([...invitees, ...newInvitees]);
    setEmailInput('');
  };

  const handleRemoveInvitee = (email: string) => {
    setInvitees(invitees.filter((inv) => inv.email !== email));
  };

  const handleSendInvites = async () => {
    if (invitees.length === 0) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const invitee of invitees) {
      await supabase.from('share_invitations').insert({
        document_id: doc.id,
        invited_by: user.id,
        invited_email: invitee.email,
        access: invitee.access,
      });
    }

    setInvitees([]);
    setLoading(false);
    loadPermissions();
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/share/${doc.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleRevokeAccess = async (docId: string, userId: string) => {
    await supabase
      .from('document_permissions')
      .delete()
      .eq('document_id', docId)
      .eq('user_id', userId);
    loadPermissions();
  };

  const handleUpdatePermission = async (docId: string, userId: string, newAccess: AccessLevel) => {
    await supabase
      .from('document_permissions')
      .update({ access: newAccess })
      .eq('document_id', docId)
      .eq('user_id', userId);
    loadPermissions();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="wide">
        <ModalHeader>
          <ModalTitle>Share</ModalTitle>
        </ModalHeader>
      <Tabs.Root defaultValue="invite" className="w-full">
        <Tabs.List className="flex border-b border-[var(--bg-border)] mb-4">
          <Tabs.Trigger
            value="invite"
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--text-secondary)] border-b-2 border-transparent data-[state=active]:text-[var(--brand-primary)] data-[state=active]:border-[var(--brand-primary)]"
          >
            <Mail size={14} />
            Invite people
          </Tabs.Trigger>
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

        {/* Tab 1: Invite People */}
        <Tabs.Content value="invite" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email addresses"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAddEmail} variant="secondary" size="sm">
              Add
            </Button>
          </div>

          {/* Pending invitees */}
          {invitees.length > 0 && (
            <div className="space-y-2">
              {invitees.map((invitee) => (
                <div
                  key={invitee.email}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--bg-border)] px-3 py-2"
                >
                  <span className="text-sm text-[var(--text-primary)]">{invitee.email}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={invitee.access}
                      onChange={(e) => {
                        setInvitees(
                          invitees.map((inv) =>
                            inv.email === invitee.email
                              ? { ...inv, access: e.target.value as AccessLevel }
                              : inv
                          )
                        );
                      }}
                      className="rounded-[var(--radius-sm)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                    >
                      <option value="view">Can view</option>
                      <option value="comment">Can comment</option>
                      <option value="edit">Can edit</option>
                    </select>
                    <button
                      onClick={() => handleRemoveInvitee(invitee.email)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSendInvites}
                loading={loading}
                className="w-full"
              >
                Send {invitees.length} invite{invitees.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}

          {/* Existing permissions */}
          {existingPermissions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-[var(--text-tertiary)] mb-2">People with access</p>
              {existingPermissions.map((perm) => {
                const profile = perm.profiles;
                return (
                  <div
                    key={`${perm.document_id}-${perm.user_id}`}
                    className="flex items-center justify-between rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={profile?.display_name || 'User'}
                        color={profile?.avatar_color || '#6366f1'}
                        src={profile?.avatar_url || undefined}
                        size="sm"
                      />
                      <div>
                        <span className="text-sm text-[var(--text-primary)]">
                          {profile?.display_name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={perm.access}
                        onChange={(e) => handleUpdatePermission(perm.document_id, perm.user_id, e.target.value as AccessLevel)}
                        className="rounded-[var(--radius-sm)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                      >
                        <option value="view">Can view</option>
                        <option value="comment">Can comment</option>
                        <option value="edit">Can edit</option>
                      </select>
                      <button
                        onClick={() => handleRevokeAccess(perm.document_id, perm.user_id)}
                        className="text-[var(--text-tertiary)] hover:text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Tabs.Content>

        {/* Tab 2: Share Link */}
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
              className="rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-secondary)]"
            >
              <option value="none">No access</option>
              <option value="view">Can view</option>
              <option value="comment">Can comment</option>
              <option value="edit">Can edit</option>
            </select>
          </div>

          {linkAccess !== 'none' && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2.5">
              <Link2 size={14} className="flex-shrink-0 text-[var(--text-tertiary)]" />
              <span className="flex-1 truncate text-sm text-[var(--text-secondary)]">
                {window.location.origin}/share/{doc.share_token || 'generating...'}
              </span>
              <Button size="sm" variant="ghost" onClick={handleCopyLink}>
                {linkCopied ? (
                  <><Check size={14} className="mr-1 text-green-500" /> Copied</>
                ) : (
                  <><Copy size={14} className="mr-1" /> Copy</>
                )}
              </Button>
            </div>
          )}
        </Tabs.Content>

        {/* Tab 3: Publish */}
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
              className={`relative h-6 w-11 rounded-full transition-colors ${
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
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/pub/${doc.share_token}`
                    );
                  }}
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
