'use client';

import { useState, useRef, ReactNode } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Hash, Calendar, FileText, X } from 'lucide-react';

interface HeaderFooterEditorProps {
  type: 'header' | 'footer';
  content?: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onClose: () => void;
  visible: boolean;
}

export function HeaderFooterEditor({
  type,
  content,
  onSave,
  onClose,
  visible,
}: HeaderFooterEditorProps) {
  const [differentFirstPage, setDifferentFirstPage] = useState(false);
  const [differentOddEven, setDifferentOddEven] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'outline-none text-xs text-[var(--text-secondary)] min-h-[24px]',
      },
    },
    onUpdate: ({ editor }) => {
      onSave(editor.getJSON());
    },
  });

  if (!visible) return null;

  return (
    <div className="border-b border-dashed border-[var(--brand-primary)]/30 bg-[var(--bg-elevated)]/50 px-[76px] py-2">
      {/* Mini toolbar */}
      <div className="mb-2 flex items-center gap-1 text-[10px]">
        <span className="mr-2 font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          {type === 'header' ? 'Header' : 'Footer'}
        </span>

        <button
          onClick={() => editor?.chain().focus().insertContent('{{pageNumber}}').run()}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
          title="Insert page number"
        >
          <Hash size={10} />
          Page #
        </button>

        <button
          onClick={() => editor?.chain().focus().insertContent(new Date().toLocaleDateString()).run()}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
          title="Insert date"
        >
          <Calendar size={10} />
          Date
        </button>

        <button
          onClick={() => editor?.chain().focus().insertContent('{{docTitle}}').run()}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
          title="Insert document title"
        >
          <FileText size={10} />
          Title
        </button>

        <div className="mx-1 h-3 w-px bg-[var(--bg-border)]" />

        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={differentFirstPage}
            onChange={(e) => setDifferentFirstPage(e.target.checked)}
            className="h-3 w-3"
          />
          <span className="text-[var(--text-tertiary)]">Different first page</span>
        </label>

        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={differentOddEven}
            onChange={(e) => setDifferentOddEven(e.target.checked)}
            className="h-3 w-3"
          />
          <span className="text-[var(--text-tertiary)]">Different odd/even</span>
        </label>

        <div className="flex-1" />

        <button
          onClick={onClose}
          className="rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          title="Close header/footer editor"
        >
          <X size={12} />
        </button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} className="header-footer-editor" />
    </div>
  );
}
