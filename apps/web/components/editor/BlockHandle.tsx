'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { type Editor } from '@tiptap/react';
import { GripVertical, Plus, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlockHandleProps {
  editor: Editor;
}

export function BlockHandle({ editor }: BlockHandleProps) {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0 });
  const [activeNodePos, setActiveNodePos] = useState<number | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { view } = editor;
    const editorElement = view.dom;

    const handleMouseMove = (event: MouseEvent) => {
      const editorRect = editorElement.getBoundingClientRect();
      const y = event.clientY - editorRect.top + editorElement.scrollTop;

      // Find the closest node at the cursor position
      const pos = view.posAtCoords({ left: editorRect.left + 20, top: event.clientY });
      if (!pos) {
        setVisible(false);
        return;
      }

      const $pos = view.state.doc.resolve(pos.pos);
      const node = $pos.node($pos.depth);
      if (!node) {
        setVisible(false);
        return;
      }

      // Get the DOM element for the node
      const domNode = view.nodeDOM(pos.inside ?? pos.pos);
      if (!domNode || !(domNode instanceof HTMLElement)) {
        setVisible(false);
        return;
      }

      const nodeRect = domNode.getBoundingClientRect();
      const top = nodeRect.top - editorRect.top + editorElement.scrollTop;

      setPosition({ top });
      setActiveNodePos(pos.inside ?? pos.pos);
      setVisible(true);
    };

    const handleMouseLeave = () => {
      if (!menuOpen) {
        setVisible(false);
      }
    };

    editorElement.addEventListener('mousemove', handleMouseMove);
    editorElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove);
      editorElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, menuOpen]);

  useEffect(() => {
    return updatePosition();
  }, [updatePosition]);

  const deleteBlock = () => {
    if (activeNodePos === null) return;
    const $pos = editor.state.doc.resolve(activeNodePos);
    const node = $pos.nodeAfter;
    if (!node) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: activeNodePos, to: activeNodePos + node.nodeSize })
      .run();
    setMenuOpen(false);
  };

  const duplicateBlock = () => {
    if (activeNodePos === null) return;
    const $pos = editor.state.doc.resolve(activeNodePos);
    const node = $pos.nodeAfter;
    if (!node) return;
    const endPos = activeNodePos + node.nodeSize;
    editor.chain().focus().insertContentAt(endPos, node.toJSON()).run();
    setMenuOpen(false);
  };

  const moveBlockUp = () => {
    if (activeNodePos === null || activeNodePos === 0) return;
    const $pos = editor.state.doc.resolve(activeNodePos);
    const node = $pos.nodeAfter;
    if (!node) return;

    const prevResolved = editor.state.doc.resolve(activeNodePos - 1);
    const prevNode = prevResolved.nodeBefore;
    if (!prevNode) return;

    const prevStart = activeNodePos - prevNode.nodeSize;
    const { tr } = editor.state;
    const nodeSlice = node.toJSON();
    tr.delete(activeNodePos, activeNodePos + node.nodeSize);
    tr.insert(prevStart, editor.state.schema.nodeFromJSON(nodeSlice));
    editor.view.dispatch(tr);
    setMenuOpen(false);
  };

  const moveBlockDown = () => {
    if (activeNodePos === null) return;
    const $pos = editor.state.doc.resolve(activeNodePos);
    const node = $pos.nodeAfter;
    if (!node) return;

    const endPos = activeNodePos + node.nodeSize;
    if (endPos >= editor.state.doc.content.size) return;

    const nextNode = editor.state.doc.resolve(endPos).nodeAfter;
    if (!nextNode) return;

    const { tr } = editor.state;
    const nodeSlice = node.toJSON();
    const afterNext = endPos + nextNode.nodeSize;
    tr.insert(afterNext, editor.state.schema.nodeFromJSON(nodeSlice));
    tr.delete(activeNodePos, activeNodePos + node.nodeSize);
    editor.view.dispatch(tr);
    setMenuOpen(false);
  };

  return (
    <div
      ref={handleRef}
      className="pointer-events-auto absolute -left-10 z-10"
      style={{ top: position.top, display: visible ? 'flex' : 'none' }}
    >
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => {
            if (activeNodePos !== null) {
              editor.chain().focus().insertContentAt(activeNodePos, { type: 'paragraph' }).run();
            }
          }}
          className="rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:hover:bg-neutral-700"
          title="Add block"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="cursor-grab rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 active:cursor-grabbing dark:hover:bg-neutral-700"
          title="Drag to move / Click for options"
          draggable
        >
          <GripVertical size={14} />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-full top-0 ml-1 w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            <MenuItem icon={<Copy size={14} />} label="Duplicate" onClick={duplicateBlock} />
            <MenuItem icon={<ArrowUp size={14} />} label="Move up" onClick={moveBlockUp} />
            <MenuItem icon={<ArrowDown size={14} />} label="Move down" onClick={moveBlockDown} />
            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />
            <MenuItem
              icon={<Trash2 size={14} />}
              label="Delete"
              onClick={deleteBlock}
              destructive
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
        destructive
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
