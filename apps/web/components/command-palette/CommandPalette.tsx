'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@syncdoc/utils';
import type { Workspace, Document } from '@syncdoc/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Plus,
  Upload,
  Settings,
  ArrowRight,
  Command,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

interface SearchResult {
  type: 'document' | 'action';
  id: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: () => void;
}

export function CommandPalette({ open, onOpenChange, workspace }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  const actions: SearchResult[] = [
    {
      type: 'action',
      id: 'new-doc',
      title: 'Create new document',
      subtitle: 'Start with a blank page',
      emoji: '📄',
      action: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('documents')
          .insert({
            workspace_id: workspace.id,
            title: 'Untitled',
            owner_id: user.id,
            last_edited_by: user.id,
          })
          .select('id')
          .single();
        if (data) router.push(`/workspace/${workspace.slug}/doc/${data.id}`);
        onOpenChange(false);
      },
    },
    {
      type: 'action',
      id: 'upload',
      title: 'Upload file',
      subtitle: 'Import DOCX, PDF, or Markdown',
      emoji: '📎',
      action: () => {
        onOpenChange(false);
        // TODO: trigger upload modal
      },
    },
    {
      type: 'action',
      id: 'settings',
      title: 'Workspace settings',
      subtitle: 'Manage your workspace',
      emoji: '⚙️',
      action: () => {
        onOpenChange(false);
        // TODO: navigate to settings
      },
    },
  ];

  const searchDocuments = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults(actions);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('documents')
        .select('id, title, emoji_icon, last_edited_at')
        .eq('workspace_id', workspace.id)
        .is('deleted_at', null)
        .ilike('title', `%${q}%`)
        .order('last_edited_at', { ascending: false })
        .limit(10);

      const docResults: SearchResult[] = (data || []).map((doc) => ({
        type: 'document' as const,
        id: doc.id,
        title: doc.title || 'Untitled',
        subtitle: formatRelativeTime(doc.last_edited_at),
        emoji: doc.emoji_icon,
        action: () => {
          router.push(`/workspace/${workspace.slug}/doc/${doc.id}`);
          onOpenChange(false);
        },
      }));

      const matchingActions = actions.filter(
        (a) =>
          a.title.toLowerCase().includes(q.toLowerCase()) ||
          (a.subtitle && a.subtitle.toLowerCase().includes(q.toLowerCase()))
      );

      setResults([...docResults, ...matchingActions]);
      setSelectedIndex(0);
      setLoading(false);
    },
    [workspace.id, workspace.slug]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => searchDocuments(query), 150);
    return () => clearTimeout(timer);
  }, [query, searchDocuments]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setResults(actions);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected?.action) selected.action();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, onOpenChange]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-[4px] pt-[20vh]"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-[560px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[var(--bg-border)] px-4 py-3">
            <Search size={18} className="flex-shrink-0 text-[var(--text-tertiary)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, actions..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
                No results found
              </div>
            ) : (
              results.map((result, i) => (
                <button
                  key={result.id}
                  onClick={() => result.action?.()}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors ${
                    i === selectedIndex
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <span className="flex-shrink-0 text-base">
                    {result.emoji || (result.type === 'document' ? '📄' : '⚡')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm">{result.title}</span>
                    {result.subtitle && (
                      <span className="block truncate text-xs text-[var(--text-tertiary)]">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                  {i === selectedIndex && (
                    <ArrowRight size={14} className="flex-shrink-0 text-[var(--text-tertiary)]" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-[var(--bg-border)] px-4 py-2 text-[10px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--bg-border)] px-1">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--bg-border)] px-1">↵</kbd> Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--bg-border)] px-1">esc</kbd> Close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
