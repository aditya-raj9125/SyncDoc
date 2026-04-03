'use client';

import { BubbleMenu as TiptapBubbleMenu, type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Sparkles,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BubbleMenuProps {
  editor: Editor;
  onAiAction?: (prompt: string, selectedText: string) => void;
}

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
];

export function BubbleMenu({ editor, onAiAction }: BubbleMenuProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const setLink = useCallback(() => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const handleAiClick = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    onAiAction?.('Improve this text:', selectedText);
  };

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 150,
        placement: 'top',
        maxWidth: 'none',
      }}
      className="bubble-menu"
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
      >
        {showLinkInput ? (
          <div className="flex items-center gap-1 px-1">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
              placeholder="https://..."
              className="w-48 rounded bg-neutral-100 px-2 py-1 text-sm outline-none dark:bg-neutral-700"
              autoFocus
            />
            <button
              onClick={setLink}
              className="rounded p-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400"
            >
              Apply
            </button>
            <button
              onClick={() => setShowLinkInput(false)}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold (Cmd+B)"
            >
              <Bold size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic (Cmd+I)"
            >
              <Italic size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline (Cmd+U)"
            >
              <Underline size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Inline Code"
            >
              <Code size={15} />
            </ToolbarButton>

            <div className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-600" />

            <div className="relative">
              <ToolbarButton
                onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                isActive={editor.isActive('highlight')}
                title="Highlight"
              >
                <Highlighter size={15} />
              </ToolbarButton>
              <AnimatePresence>
                {showHighlightPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full left-0 mt-1 flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          editor.chain().focus().toggleHighlight({ color: color.value }).run();
                          setShowHighlightPicker(false);
                        }}
                        className="h-5 w-5 rounded-full border border-neutral-300 transition-transform hover:scale-110"
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                    <button
                      onClick={() => {
                        editor.chain().focus().unsetHighlight().run();
                        setShowHighlightPicker(false);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-[10px] text-neutral-500"
                      title="Remove highlight"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ToolbarButton
              onClick={() => {
                const previousUrl = editor.getAttributes('link').href;
                setLinkUrl(previousUrl || '');
                setShowLinkInput(true);
              }}
              isActive={editor.isActive('link')}
              title="Link (Cmd+K)"
            >
              <Link size={15} />
            </ToolbarButton>

            <div className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-600" />

            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight size={15} />
            </ToolbarButton>

            {onAiAction && (
              <>
                <div className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-600" />
                <ToolbarButton onClick={handleAiClick} title="AI Improve">
                  <Sparkles size={15} className="text-violet-500" />
                </ToolbarButton>
              </>
            )}
          </>
        )}
      </motion.div>
    </TiptapBubbleMenu>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        isActive
          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  );
}
