'use client';

import { useEffect } from 'react';
import { EditorTopbar } from './EditorTopbar';
import { Editor } from './Editor';
import { useEditorStore } from '@/store/editorStore';
import { EditorSkeleton } from '@/components/ui/Skeleton';
import { ShareModal } from '@/components/sharing/ShareModal';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { useUIStore } from '@/store/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Document, Workspace, Profile } from '@syncdoc/types';
import type { AccessLevel } from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorPageProps {
  document: Document;
  workspace: Workspace;
  profile: Profile;
  accessLevel: AccessLevel;
}

export function EditorPage({ document, workspace, profile, accessLevel }: EditorPageProps) {
  const { isLoading, focusMode, setDocumentId, setTitle, setEmojiIcon, setCoverImageUrl, setLoading } =
    useEditorStore();
  const { shareModalOpen, commandPaletteOpen, setShareModalOpen, setCommandPaletteOpen } = useUIStore();

  useKeyboardShortcuts(workspace.slug);

  useEffect(() => {
    setDocumentId(document.id);
    setTitle(document.title);
    setEmojiIcon(document.emoji_icon);
    setCoverImageUrl(document.cover_image_url);
    setLoading(false);

    return () => {
      useEditorStore.getState().reset();
    };
  }, [document.id, document.title, document.emoji_icon, document.cover_image_url, setDocumentId, setTitle, setEmojiIcon, setCoverImageUrl, setLoading]);

  return (
    <div className="flex h-full flex-col">
      {/* Topbar */}
      <AnimatePresence>
        {!focusMode && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EditorTopbar
              document={document}
              workspace={workspace}
              profile={profile}
              accessLevel={accessLevel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <EditorSkeleton />
          ) : (
            <Editor
              document={document}
              workspace={workspace}
              profile={profile}
              accessLevel={accessLevel}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        document={document}
        workspace={workspace}
      />
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        workspace={workspace}
      />

      {/* Focus mode escape hint */}
      {focusMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-4 right-4 z-50 rounded-[var(--radius-md)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-tertiary)] shadow-md border border-[var(--bg-border)]"
        >
          Press Esc to exit focus mode
        </motion.div>
      )}
    </div>
  );
}
