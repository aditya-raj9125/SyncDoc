import { create } from 'zustand';
import type { ConnectionStatus } from '@syncdoc/types';

interface EditorStoreState {
  documentId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isOffline: boolean;
  connectionStatus: ConnectionStatus;
  wordCount: number;
  characterCount: number;
  focusMode: boolean;
  title: string;
  emojiIcon: string;
  coverImageUrl: string | null;
}

interface EditorStoreActions {
  setDocumentId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setOffline: (offline: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setWordCount: (count: number) => void;
  setCharacterCount: (count: number) => void;
  toggleFocusMode: () => void;
  setTitle: (title: string) => void;
  setEmojiIcon: (emoji: string) => void;
  setCoverImageUrl: (url: string | null) => void;
  reset: () => void;
}

const initialState: EditorStoreState = {
  documentId: null,
  isLoading: true,
  isSaving: false,
  isOffline: false,
  connectionStatus: 'connecting',
  wordCount: 0,
  characterCount: 0,
  focusMode: false,
  title: 'Untitled',
  emojiIcon: '📄',
  coverImageUrl: null,
};

export const useEditorStore = create<EditorStoreState & EditorStoreActions>((set) => ({
  ...initialState,

  setDocumentId: (id) => set({ documentId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
  setOffline: (offline) => set({ isOffline: offline }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setWordCount: (count) => set({ wordCount: count }),
  setCharacterCount: (count) => set({ characterCount: count }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  setTitle: (title) => set({ title }),
  setEmojiIcon: (emoji) => set({ emojiIcon: emoji }),
  setCoverImageUrl: (url) => set({ coverImageUrl: url }),
  reset: () => set(initialState),
}));
