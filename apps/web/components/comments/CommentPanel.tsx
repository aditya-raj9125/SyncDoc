'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatRelativeTime, getInitials } from '@syncdoc/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { Comment, Profile } from '@syncdoc/types';
import {
  MessageSquare,
  X,
  Check,
  CornerDownRight,
  ChevronDown,
} from 'lucide-react';

interface CommentPanelProps {
  documentId: string;
}

interface CommentWithProfile extends Comment {
  profiles?: Profile;
  replies?: CommentWithProfile[];
}

export function CommentPanel({ documentId }: CommentPanelProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    loadComments();

    // Subscribe to real-time comment changes
    const channel = supabase
      .channel(`comments:${documentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `document_id=eq.${documentId}` },
        () => loadComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('document_id', documentId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (data) {
      // Load replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment: CommentWithProfile) => {
          const { data: replies } = await supabase
            .from('comments')
            .select('*, profiles(*)')
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });
          return { ...comment, replies: replies || [] };
        })
      );
      setComments(commentsWithReplies);
    }
    setLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('comments').insert({
      document_id: documentId,
      author_id: user.id,
      body: newComment.trim(),
    });

    setNewComment('');
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('comments').insert({
      document_id: documentId,
      author_id: user.id,
      parent_comment_id: parentId,
      body: replyText.trim(),
    });

    setReplyingTo(null);
    setReplyText('');
  };

  const handleResolve = async (commentId: string) => {
    await supabase
      .from('comments')
      .update({ resolved: true })
      .eq('id', commentId);
  };

  const handleUnresolve = async (commentId: string) => {
    await supabase
      .from('comments')
      .update({ resolved: false })
      .eq('id', commentId);
  };

  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  return (
    <div className="flex h-full w-[360px] flex-col bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--bg-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Comments</span>
          {unresolvedComments.length > 0 && (
            <span className="rounded-full bg-[var(--brand-primary)] px-1.5 py-0.5 text-[10px] font-medium text-white">
              {unresolvedComments.length}
            </span>
          )}
        </div>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[var(--bg-elevated)]" />
                  <div className="h-3 w-24 rounded bg-[var(--bg-elevated)]" />
                </div>
                <div className="h-4 w-full rounded bg-[var(--bg-elevated)]" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare size={32} className="mb-3 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">No comments yet</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Select text in the editor and click the comment icon to start a discussion
            </p>
          </div>
        ) : (
          <>
            {/* Unresolved comments */}
            {unresolvedComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onResolve={handleResolve}
                onUnresolve={handleUnresolve}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                onSubmitReply={handleSubmitReply}
              />
            ))}

            {/* Resolved comments */}
            {resolvedComments.length > 0 && (
              <div>
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${showResolved ? 'rotate-0' : '-rotate-90'}`}
                  />
                  {resolvedComments.length} resolved
                </button>
                {showResolved &&
                  resolvedComments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      onResolve={handleResolve}
                      onUnresolve={handleUnresolve}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      onSubmitReply={handleSubmitReply}
                      isResolved
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* New comment input */}
      <div className="border-t border-[var(--bg-border)] p-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmitComment();
            }
          }}
          placeholder="Add a comment..."
          className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
          rows={2}
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={handleSubmitComment} disabled={!newComment.trim()}>
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  onResolve,
  onUnresolve,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
  isResolved = false,
}: {
  comment: CommentWithProfile;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (t: string) => void;
  onSubmitReply: (parentId: string) => void;
  isResolved?: boolean;
}) {
  const profile = comment.profiles;
  return (
    <div className={`rounded-[var(--radius-lg)] border border-[var(--bg-border)] p-3 ${isResolved ? 'opacity-60' : ''}`}>
      {/* Anchor text */}
      {comment.quoted_text && (
        <div className="mb-2 rounded-[var(--radius-sm)] bg-yellow-50 px-2 py-1 text-xs italic text-[var(--text-secondary)] dark:bg-yellow-900/20">
          &ldquo;{comment.quoted_text}&rdquo;
        </div>
      )}

      {/* Comment author + content */}
      <div className="flex items-start gap-2">
        <Avatar
          name={profile?.display_name || 'User'}
          color={profile?.avatar_color || '#6366f1'}
          src={profile?.avatar_url || undefined}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {profile?.display_name || 'User'}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{comment.body}</p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-3 space-y-2 border-l-2 border-[var(--bg-border)] pl-3">
          {comment.replies.map((reply) => {
            const replyProfile = reply.profiles;
            return (
              <div key={reply.id} className="flex items-start gap-2">
                <Avatar
                  name={replyProfile?.display_name || 'User'}
                  color={replyProfile?.avatar_color || '#6366f1'}
                  src={replyProfile?.avatar_url || undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {replyProfile?.display_name || 'User'}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {formatRelativeTime(reply.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{reply.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="mt-2 flex items-center gap-2 ml-8">
        <button
          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          <CornerDownRight size={12} />
          Reply
        </button>
        {isResolved ? (
          <button
            onClick={() => onUnresolve(comment.id)}
            className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Unresolve
          </button>
        ) : (
          <button
            onClick={() => onResolve(comment.id)}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
          >
            <Check size={12} />
            Resolve
          </button>
        )}
      </div>

      {/* Reply input */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                onSubmitReply(comment.id);
              }
            }}
            placeholder="Write a reply..."
            className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--brand-primary)]"
            rows={2}
            autoFocus
          />
          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={() => setReplyingTo(null)}
              className="rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            >
              Cancel
            </button>
            <Button size="sm" onClick={() => onSubmitReply(comment.id)} disabled={!replyText.trim()}>
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
