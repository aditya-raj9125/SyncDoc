'use client';

import { useEffect, useState } from 'react';
import { type Editor } from '@tiptap/react';
import { usePresenceStore } from '@/store/presenceStore';
import { motion, AnimatePresence } from 'framer-motion';

interface CursorData {
  clientId: number;
  name: string;
  color: string;
  top: number;
  left: number;
  visible: boolean;
}

interface RemoteCursorsProps {
  editor: Editor;
}

export function RemoteCursors({ editor }: RemoteCursorsProps) {
  const { users, localClientId } = usePresenceStore();
  const [cursors, setCursors] = useState<CursorData[]>([]);

  useEffect(() => {
    const updateCursors = () => {
      const newCursors: CursorData[] = [];
      const editorElement = editor.view.dom;
      const editorRect = editorElement.getBoundingClientRect();

      users.forEach((user, clientId) => {
        if (clientId === localClientId) return;

        // Get cursor position from awareness state (if provided via decoration)
        // This renders name labels for remote users
        const awareness = (editor.view as unknown as Record<string, unknown>).awareness;
        if (!awareness) return;

        const state = (awareness as { getStates: () => Map<number, Record<string, unknown>> })
          .getStates()
          .get(clientId);
        if (!state?.cursor) return;

        const cursor = state.cursor as { anchor: number; head: number };

        try {
          const coords = editor.view.coordsAtPos(cursor.head);
          newCursors.push({
            clientId,
            name: user.user.name,
            color: user.user.color,
            top: coords.top - editorRect.top,
            left: coords.left - editorRect.left,
            visible: true,
          });
        } catch {
          // Position may be out of range during sync
        }
      });

      setCursors(newCursors);
    };

    // Update on editor transactions
    editor.on('transaction', updateCursors);
    const interval = setInterval(updateCursors, 500);

    return () => {
      editor.off('transaction', updateCursors);
      clearInterval(interval);
    };
  }, [editor, users, localClientId]);

  return (
    <AnimatePresence>
      {cursors.map((cursor) => (
        <motion.div
          key={cursor.clientId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute z-50"
          style={{
            top: cursor.top,
            left: cursor.left,
          }}
        >
          {/* Cursor line */}
          <div
            className="h-5 w-0.5 rounded-full"
            style={{ backgroundColor: cursor.color }}
          />
          {/* Name label */}
          <div
            className="-mt-0.5 ml-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
