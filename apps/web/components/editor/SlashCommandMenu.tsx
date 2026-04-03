'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor, Range } from '@tiptap/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Image as ImageIcon,
  Video,
  Minus,
  Table as TableIcon,
  AtSign,
  LinkIcon,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface SlashCommandMenuProps {
  editor: Editor;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  group: string;
  action: (editor: Editor) => void;
}

const commands: CommandItem[] = [
  // Text
  {
    title: 'Text',
    description: 'Plain text paragraph',
    icon: <Type size={18} />,
    group: 'Text',
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large heading',
    icon: <Heading1 size={18} />,
    group: 'Heading',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: <Heading2 size={18} />,
    group: 'Heading',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    icon: <Heading3 size={18} />,
    group: 'Heading',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  // Lists
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: <List size={18} />,
    group: 'Lists',
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    icon: <ListOrdered size={18} />,
    group: 'Lists',
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Task List',
    description: 'Checkbox list',
    icon: <CheckSquare size={18} />,
    group: 'Lists',
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  // Blocks
  {
    title: 'Quote',
    description: 'Block quote',
    icon: <Quote size={18} />,
    group: 'Text',
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Syntax highlighted code',
    icon: <Code2 size={18} />,
    group: 'Text',
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Callout',
    description: 'Colored info box',
    icon: <AlertCircle size={18} />,
    group: 'Special',
    action: (editor) => editor.chain().focus().setCallout({ variant: 'info' }).run(),
  },
  // Media
  {
    title: 'Image',
    description: 'Upload or paste URL',
    icon: <ImageIcon size={18} />,
    group: 'Media',
    action: (editor) => {
      const url = window.prompt('Enter image URL');
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    icon: <Minus size={18} />,
    group: 'Media',
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: <TableIcon size={18} />,
    group: 'Media',
    action: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  // Special
  {
    title: 'Mention',
    description: 'Tag a person',
    icon: <AtSign size={18} />,
    group: 'Special',
    action: (editor) => editor.chain().focus().insertContent('@').run(),
  },
  {
    title: 'AI Write',
    description: 'Generate with AI',
    icon: <Sparkles size={18} />,
    group: 'AI',
    action: () => {/* TODO: open AI inline prompt */},
  },
];

export function SlashCommandMenu({ editor }: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()) ||
      cmd.group.toLowerCase().includes(search.toLowerCase())
  );

  // Group the commands
  const groups = Array.from(new Set(filteredCommands.map((c) => c.group)));

  const executeCommand = useCallback(
    (index: number) => {
      const cmd = filteredCommands[index];
      if (!cmd) return;

      // Delete the slash character
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - search.length - 1),
        from,
        '\0'
      );

      if (textBefore.startsWith('/')) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: from - search.length - 1, to: from })
          .run();
      }

      cmd.action(editor);
      setIsOpen(false);
      setSearch('');
    },
    [editor, filteredCommands, search]
  );

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        // Check for / at start of empty block
        if (event.key === '/') {
          const { state } = editor;
          const { $from } = state.selection;
          const isEmptyLine = $from.parent.textContent === '';

          if (isEmptyLine) {
            // Get cursor position for menu placement
            const coords = editor.view.coordsAtPos(state.selection.from);
            setPosition({
              top: coords.bottom + 8,
              left: coords.left,
            });
            setIsOpen(true);
            setSearch('');
            setSelectedIndex(0);
          }
        }
        return;
      }

      // Menu is open
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        setSearch('');
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        executeCommand(selectedIndex);
        return;
      }

      if (event.key === 'Backspace') {
        if (search.length === 0) {
          setIsOpen(false);
          return;
        }
        setSearch((prev) => prev.slice(0, -1));
        setSelectedIndex(0);
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        setSearch((prev) => prev + event.key);
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, isOpen, search, filteredCommands.length, selectedIndex, executeCommand]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!containerRef.current) return;
    const selected = containerRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen || filteredCommands.length === 0) return null;

  let globalIndex = 0;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 w-72 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
      style={{ top: position.top, left: position.left }}
    >
      {/* Search indicator */}
      {search && (
        <div className="border-b border-[var(--bg-border)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
          Searching: <span className="text-[var(--text-primary)]">{search}</span>
        </div>
      )}

      <div className="max-h-[320px] overflow-y-auto p-1">
        {groups.map((group) => {
          const groupItems = filteredCommands.filter((c) => c.group === group);
          return (
            <div key={group}>
              <div className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                {group}
              </div>
              {groupItems.map((cmd) => {
                const idx = globalIndex++;
                return (
                  <button
                    key={cmd.title}
                    data-selected={idx === selectedIndex}
                    onClick={() => executeCommand(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 text-left transition-colors ${
                      idx === selectedIndex
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{cmd.title}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{cmd.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
