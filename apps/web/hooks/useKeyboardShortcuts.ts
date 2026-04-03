'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useEditorStore } from '@/store/editorStore';
import { createBrowserClient } from '@/lib/supabase/client';
import { isMac } from '@syncdoc/utils';

export function useKeyboardShortcuts(workspaceSlug: string) {
  const router = useRouter();
  const { setCommandPaletteOpen, commandPaletteOpen, activePanel, setActivePanel, shareModalOpen, setShareModalOpen } =
    useUIStore();
  const { focusMode, toggleFocusMode } = useEditorStore();

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      const mod = isMac() ? e.metaKey : e.ctrlKey;

      // Escape — close any open panel/modal, exit focus mode
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (shareModalOpen) {
          setShareModalOpen(false);
          return;
        }
        if (activePanel) {
          setActivePanel(null);
          return;
        }
        if (focusMode) {
          toggleFocusMode();
          return;
        }
      }

      if (!mod) return;

      // Cmd/Ctrl + N → New document
      if (e.key === 'n' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id')
          .eq('slug', workspaceSlug)
          .single();

        if (!workspace) return;

        const { data: doc } = await supabase
          .from('documents')
          .insert({
            workspace_id: workspace.id,
            title: 'Untitled',
            owner_id: user.id,
            last_edited_by: user.id,
          })
          .select('id')
          .single();

        if (doc) {
          router.push(`/workspace/${workspaceSlug}/doc/${doc.id}`);
        }
      }

      // Cmd/Ctrl + K → Command palette
      if (e.key === 'k' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }

      // Cmd/Ctrl + S → Force save (prevent browser save dialog)
      if (e.key === 's' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // Hocuspocus will handle persistence; this is a no-op save indicator
        const store = useEditorStore.getState();
        store.setSaving(true);
        setTimeout(() => store.setSaving(false), 1000);
      }

      // Cmd/Ctrl + \ → Toggle sidebar
      if (e.key === '\\' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        useUIStore.getState().toggleSidebar();
      }
    },
    [
      workspaceSlug,
      router,
      commandPaletteOpen,
      shareModalOpen,
      activePanel,
      focusMode,
      setCommandPaletteOpen,
      setShareModalOpen,
      setActivePanel,
      toggleFocusMode,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
