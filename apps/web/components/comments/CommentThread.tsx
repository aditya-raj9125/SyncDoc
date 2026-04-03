'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime, getInitials } from '@syncdoc/utils';
import type { Comment, Profile } from '@syncdoc/types';
import {
  Check,
  CornerDownRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';

interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

interface CommentThreadProps {
  comment: CommentWithProfile & { replies?: CommentWithProfile[] };
  currentUserId: string;
  onResolve: (commentId: string) => void;
  onReply: (parentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, body: string) => void;
}

export function CommentThread({
  comment,
  currentUserId,
  onResolve,
  onReply,
  onDelete,
  onEdit,
}: CommentThreadProps) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = comment.author_id === currentUserId;
  const profile = comment.profiles;

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setReplyText('');
    setReplying(false);
  };

  const handleEdit = () => {
    if (!editText.trim()) return;
    onEdit(comment.id, editText);
    setEditing(false);
  };

  return (
    <div className="group border-b border-neutral-100 px-4 py-3 last:border-0 dark:border-neutral-800">
      {/* Main comment */}
      <div className="flex items-start gap-2.5">
        <Avatar
          name={profile?.display_name || 'User'}
          src={profile?.avatar_url || null}
          color={profile?.avatar_color || '#6366f1'}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {profile?.display_name || 'User'}
            </span>
            <span className="text-xs text-neutral-400">
              {formatRelativeTime(comment.created_at)}
            </span>
            <div className="relative ml-auto">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 group-hover:opacity-100 dark:hover:bg-neutral-700"
              >
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                  <button
                    onClick={() => {
                      onResolve(comment.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <Check size={14} />
                    Resolve
                  </button>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setEditing(true);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment.id);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <div className="mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-neutral-700 dark:bg-neutral-800"
                rows={2}
              />
              <div className="mt-1 flex gap-1">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">
              {comment.body}
            </p>
          )}

          {comment.resolved && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Check size={10} />
              Resolved
            </span>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-neutral-100 pl-3 dark:border-neutral-800">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <Avatar
                name={reply.profiles?.display_name || 'User'}
                src={reply.profiles?.avatar_url || null}
                color={reply.profiles?.avatar_color || '#6366f1'}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {reply.profiles?.display_name || 'User'}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {formatRelativeTime(reply.created_at)}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {reply.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {replying ? (
        <div className="ml-8 mt-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleReply())}
            placeholder="Reply..."
            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-neutral-700 dark:bg-neutral-800"
            rows={2}
            autoFocus
          />
          <div className="mt-1 flex gap-1">
            <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>
              Reply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setReplying(true)}
          className="ml-8 mt-1.5 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          <CornerDownRight size={12} />
          Reply
        </button>
      )}
    </div>
  );
}
