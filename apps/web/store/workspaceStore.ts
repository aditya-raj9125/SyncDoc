/**
 * FIX 12 — Workspace Store (Zustand)
 *
 * Single source of truth for all workspace state across the app.
 * All UI reads from this store, never directly fetches in components.
 * Optimistic updates for every mutation.
 */

import { create } from 'zustand';
import type { Document, Folder } from '@syncdoc/types';

// Extended Document type with owner info
export type DocumentWithOwner = Document & {
  owner?: { display_name: string; avatar_url: string | null; avatar_color: string };
};

interface WorkspaceStoreState {
  documents: DocumentWithOwner[];
  folders: Folder[];
  sharedDocuments: DocumentWithOwner[];
  starredDocumentIds: Set<string>;
  isHydrated: boolean;
}

interface WorkspaceStoreActions {
  // Init
  setDocuments: (docs: DocumentWithOwner[]) => void;
  setFolders: (folders: Folder[]) => void;
  setSharedDocuments: (docs: DocumentWithOwner[]) => void;
  setStarredIds: (ids: Set<string>) => void;
  setHydrated: (hydrated: boolean) => void;

  // Realtime merge operations (MERGE pattern — never full refetch)
  mergeDocument: (doc: DocumentWithOwner) => void;
  removeDocument: (docId: string) => void;

  mergeFolder: (folder: Folder) => void;
  removeFolder: (folderId: string) => void;

  addSharedDocument: (doc: DocumentWithOwner) => void;
  removeSharedDocument: (docId: string) => void;

  addStarred: (docId: string) => void;
  removeStarred: (docId: string) => void;

  // Optimistic update + rollback pattern
  optimisticRenameDocument: (docId: string, newTitle: string) => string;
  rollbackDocumentTitle: (docId: string, previousTitle: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState & WorkspaceStoreActions>((set, get) => ({
  // State
  documents: [],
  folders: [],
  sharedDocuments: [],
  starredDocumentIds: new Set(),
  isHydrated: false,

  // Setters
  setDocuments: (docs) => set({ documents: docs }),
  setFolders: (folders) => set({ folders }),
  setSharedDocuments: (docs) => set({ sharedDocuments: docs }),
  setStarredIds: (ids) => set({ starredDocumentIds: ids }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),

  // Realtime: Merge/upsert a document update (UPDATE event)
  mergeDocument: (doc) => set((state) => {
    const existingIdx = state.documents.findIndex(d => d.id === doc.id);
    if (existingIdx === -1) {
      // INSERT — prepend (newest first)
      return { documents: [doc, ...state.documents] };
    }
    // UPDATE — merge only changed fields
    const updated = [...state.documents];
    updated[existingIdx] = { ...updated[existingIdx], ...doc };
    return { documents: updated };
  }),

  // Realtime: Remove a document (DELETE or soft-delete event)
  removeDocument: (docId) => set((state) => ({
    documents: state.documents.filter(d => d.id !== docId),
    sharedDocuments: state.sharedDocuments.filter(d => d.id !== docId),
  })),

  // Folder operations
  mergeFolder: (folder) => set((state) => {
    const existingIdx = state.folders.findIndex(f => f.id === folder.id);
    if (existingIdx === -1) return { folders: [...state.folders, folder] };
    const updated = [...state.folders];
    updated[existingIdx] = { ...updated[existingIdx], ...folder };
    return { folders: updated };
  }),

  removeFolder: (folderId) => set((state) => ({
    folders: state.folders.filter(f => f.id !== folderId),
  })),

  // Shared document operations
  addSharedDocument: (doc) => set((state) => {
    if (state.sharedDocuments.find(d => d.id === doc.id)) return state;
    return { sharedDocuments: [doc, ...state.sharedDocuments] };
  }),

  removeSharedDocument: (docId) => set((state) => ({
    sharedDocuments: state.sharedDocuments.filter(d => d.id !== docId),
  })),

  // Star operations
  addStarred: (docId) => set((state) => ({
    starredDocumentIds: new Set([...state.starredDocumentIds, docId]),
  })),

  removeStarred: (docId) => set((state) => {
    const next = new Set(state.starredDocumentIds);
    next.delete(docId);
    return { starredDocumentIds: next };
  }),

  // Optimistic rename — updates state immediately, returns previous title for rollback
  optimisticRenameDocument: (docId, newTitle) => {
    const state = get();
    const doc = state.documents.find(d => d.id === docId);
    const previousTitle = doc?.title || '';
    set((s) => ({
      documents: s.documents.map(d => d.id === docId ? { ...d, title: newTitle } : d),
      sharedDocuments: s.sharedDocuments.map(d => d.id === docId ? { ...d, title: newTitle } : d),
    }));
    return previousTitle;
  },

  // Rollback rename on mutation failure
  rollbackDocumentTitle: (docId, previousTitle) => set((s) => ({
    documents: s.documents.map(d => d.id === docId ? { ...d, title: previousTitle } : d),
    sharedDocuments: s.sharedDocuments.map(d => d.id === docId ? { ...d, title: previousTitle } : d),
  })),
}));
