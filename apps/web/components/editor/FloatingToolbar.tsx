'use client';

import { useCallback } from 'react';
import { BubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  Paintbrush,
  Highlighter,
} from 'lucide-react';

interface FloatingToolbarProps {
  editor: Editor;
}

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#FEF08A' },
  { label: 'Green', value: '#BBF7D0' },
  { label: 'Blue', value: '#BFDBFE' },
  { label: 'Pink', value: '#FBCFE8' },
  { label: 'Orange', value: '#FED7AA' },
];

type ToolbarButton = {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  isActive: boolean;
  shortcut?: string;
};

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const buttons: (ToolbarButton | 'separator')[] = [
    {
      icon: <Bold size={16} />,
      label: 'Bold',
      shortcut: '⌘B',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: <Italic size={16} />,
      label: 'Italic',
      shortcut: '⌘I',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: <Underline size={16} />,
      label: 'Underline',
      shortcut: '⌘U',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
    },
    {
      icon: <Strikethrough size={16} />,
      label: 'Strikethrough',
      shortcut: '⌘⇧S',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
    },
    {
      icon: <Code size={16} />,
      label: 'Code',
      shortcut: '⌘E',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
    },
    'separator',
    {
      icon: <Link2 size={16} />,
      label: 'Link',
      shortcut: '⌘K',
      action: setLink,
      isActive: editor.isActive('link'),
    },
    {
      icon: <Paintbrush size={16} />,
      label: 'Text color',
      action: () => {},
      isActive: false,
    },
    {
      icon: <Highlighter size={16} />,
      label: 'Highlight',
      action: () => {
        editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run();
      },
      isActive: editor.isActive('highlight'),
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 150,
        placement: 'top',
        animation: 'scale',
      }}
      className="floating-toolbar"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-0.5 rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.95)] px-2 py-1.5 shadow-[var(--shadow-floating)] backdrop-blur-[12px] dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(28,25,23,0.95)]"
      >
        {buttons.map((item, i) => {
          if (item === 'separator') {
            return (
              <div
                key={`sep-${i}`}
                className="mx-1 h-5 w-px bg-[var(--bg-border)]"
              />
            );
          }
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors ${
                item.isActive
                  ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              }`}
              title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          );
        })}
      </motion.div>
    </BubbleMenu>
  );
}
