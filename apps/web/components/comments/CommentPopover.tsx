'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Profile } from '@syncdoc/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send } from 'lucide-react';

interface CommentPopoverProps {
  documentId: string;
  anchorText: string;
  selectionRange: { from: number; to: number } | null;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onSubmit: (body: string, anchorText: string, range: { from: number; to: number }) => void;
}

export function CommentPopover({
  documentId,
  anchorText,
  selectionRange,
  position,
  onClose,
  onSubmit,
}: CommentPopoverProps) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!position || !selectionRange) return null;

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    onSubmit(body, anchorText, selectionRange);
    setBody('');
    setSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        className="absolute z-50 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-700">
          <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <MessageSquarePlus size={14} />
            Add comment
          </div>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X size={14} />
          </button>
        </div>

        {anchorText && (
          <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-700">
            <p className="line-clamp-2 text-xs italic text-neutral-500 dark:text-neutral-400">
              &ldquo;{anchorText}&rdquo;
            </p>
          </div>
        )}

        <div className="p-3">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Write a comment..."
            className="w-full resize-none rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-neutral-600 dark:bg-neutral-700"
            rows={3}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-neutral-400">
              ⌘+Enter to submit
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
            >
              <Send size={12} />
              Comment
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
