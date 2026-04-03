'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatRelativeTime, formatPreciseDate } from '@syncdoc/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import type { DocumentRevision, Profile } from '@syncdoc/types';
import {
  History,
  Save,
  RotateCcw,
  Copy,
  Clock,
} from 'lucide-react';

interface RevisionPanelProps {
  documentId: string;
}

interface RevisionWithProfile extends DocumentRevision {
  profiles?: Profile;
}

export function RevisionPanel({ documentId }: RevisionPanelProps) {
  const [revisions, setRevisions] = useState<RevisionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    loadRevisions();
  }, [documentId]);

  const loadRevisions = async () => {
    const { data } = await supabase
      .from('document_revisions')
      .select('*, profiles(*)')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (data) setRevisions(data);
    setLoading(false);
  };

  const handleSaveSnapshot = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current document state
    const { data: doc } = await supabase
      .from('documents')
      .select('ydoc_state, word_count')
      .eq('id', documentId)
      .single();

    if (!doc) return;

    await supabase.from('document_revisions').insert({
      document_id: documentId,
      created_by: user.id,
      ydoc_snapshot: doc.ydoc_state,
      label: labelInput.trim() || 'Manual save',
    });

    setShowSaveModal(false);
    setLabelInput('');
    loadRevisions();
  };

  const handleRestore = async (revisionId: string) => {
    const revision = revisions.find((r) => r.id === revisionId);
    if (!revision) return;

    const confirmed = window.confirm(
      'Are you sure you want to restore this version? Current content will be replaced.'
    );
    if (!confirmed) return;

    await supabase
      .from('documents')
      .update({
        ydoc_state: revision.ydoc_snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    window.location.reload();
  };

  const handleDuplicate = async (revisionId: string) => {
    const revision = revisions.find((r) => r.id === revisionId);
    if (!revision) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: originalDoc } = await supabase
      .from('documents')
      .select('workspace_id, title')
      .eq('id', documentId)
      .single();

    if (!originalDoc) return;

    await supabase.from('documents').insert({
      workspace_id: originalDoc.workspace_id,
      title: `${originalDoc.title} (restored copy)`,
      owner_id: user.id,
      last_edited_by: user.id,
      ydoc_state: revision.ydoc_snapshot,
    });
  };

  return (
    <div className="flex h-full w-[360px] flex-col bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--bg-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Version History</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSaveModal(!showSaveModal)}
        >
          <Save size={14} className="mr-1" />
          Save version
        </Button>
      </div>

      {/* Save version input */}
      {showSaveModal && (
        <div className="border-b border-[var(--bg-border)] p-4">
          <input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Version label (optional)"
            className="w-full rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--brand-primary)]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveSnapshot();
            }}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setShowSaveModal(false)}
              className="rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            >
              Cancel
            </button>
            <Button size="sm" onClick={handleSaveSnapshot}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Revision timeline */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 w-32 rounded bg-[var(--bg-elevated)]" />
                <div className="h-3 w-48 rounded bg-[var(--bg-elevated)]" />
              </div>
            ))}
          </div>
        ) : revisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Clock size={32} className="mb-3 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">No versions yet</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Versions are created automatically as you edit, or you can save one manually
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--bg-border)]" />

            {revisions.map((revision, i) => {
              const profile = revision.profiles;
              const isSelected = selectedRevision === revision.id;
              const sizeInfo = revision.delta_size_bytes
                ? `${(revision.delta_size_bytes / 1024).toFixed(1)} KB`
                : '';

              return (
                <div
                  key={revision.id}
                  className={`relative flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-[var(--bg-elevated)] ${
                    isSelected ? 'bg-[var(--bg-elevated)]' : ''
                  }`}
                  onClick={() => setSelectedRevision(isSelected ? null : revision.id)}
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center">
                    <div className={`h-2.5 w-2.5 rounded-full border-2 ${
                      i === 0
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]'
                        : 'border-[var(--bg-border)] bg-[var(--bg-surface)]'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Tooltip content={formatPreciseDate(revision.created_at)}>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatRelativeTime(revision.created_at)}
                      </span>
                    </Tooltip>

                    <div className="mt-0.5 flex items-center gap-2">
                      {profile && (
                        <Avatar
                          name={profile.display_name}
                          color={profile.avatar_color}
                          src={profile.avatar_url || undefined}
                          size="sm"
                        />
                      )}
                      <span className="text-xs text-[var(--text-secondary)]">
                        {profile?.display_name || 'Unknown'}
                      </span>
                    </div>

                    {revision.label && (
                      <span className="mt-1 inline-block rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                        {revision.label}
                      </span>
                    )}

                    {sizeInfo && (
                      <span className="ml-2 text-[10px] text-[var(--text-tertiary)]">
                        {sizeInfo}
                      </span>
                    )}

                    {/* Actions */}
                    {isSelected && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(revision.id);
                          }}
                        >
                          <RotateCcw size={12} className="mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(revision.id);
                          }}
                        >
                          <Copy size={12} className="mr-1" />
                          Duplicate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
