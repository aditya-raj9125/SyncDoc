'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from '@/lib/tiptap/extensions';
import { formatRelativeTime, getReadingTime, formatWordCount } from '@syncdoc/utils';
import { FileText } from 'lucide-react';

interface PubPageContentProps {
  document: {
    id: string;
    title: string;
    emoji_icon?: string;
    content?: Record<string, unknown>;
    cover_image_url?: string;
    created_at: string;
    last_edited_at: string;
  };
}

export function PubPageContent({ document }: PubPageContentProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: getExtensions(),
    content: document.content || { type: 'doc', content: [] },
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none',
      },
    },
  });

  // Estimate word count from content
  const textContent = editor?.getText() || '';
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  const readingTime = getReadingTime(wordCount);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      {/* Cover image */}
      {document.cover_image_url && (
        <div
          className="h-[240px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${document.cover_image_url})` }}
        />
      )}

      {/* Content */}
      <article className="mx-auto max-w-[720px] px-6 py-12 md:px-8">
        {/* Meta */}
        <div className="mb-6 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span>{formatRelativeTime(document.last_edited_at)}</span>
          <span>·</span>
          <span>{formatWordCount(wordCount)}</span>
          <span>·</span>
          <span>{readingTime} min read</span>
        </div>

        {/* Title */}
        <h1
          className="mb-8 text-[48px] font-normal leading-[1.1] text-[var(--text-primary)]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {document.emoji_icon && (
            <span className="mr-3">{document.emoji_icon}</span>
          )}
          {document.title || 'Untitled'}
        </h1>

        {/* Editor content (read-only) */}
        {editor && (
          <EditorContent
            editor={editor}
            className="syncdoc-editor"
          />
        )}

        {/* Footer */}
        <div className="mt-16 flex items-center gap-2 border-t border-[var(--bg-border)] pt-6 text-xs text-[var(--text-tertiary)]">
          <FileText size={14} />
          <span>Published with SyncDoc</span>
        </div>
      </article>
    </div>
  );
}
