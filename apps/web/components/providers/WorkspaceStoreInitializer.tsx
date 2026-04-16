'use client';

import { useEffect } from 'react';
import { useWorkspaceStore, type DocumentWithOwner } from '@/store/workspaceStore';
import type { Folder } from '@syncdoc/types';

interface WorkspaceStoreInitializerProps {
  documents: DocumentWithOwner[];
  sharedDocuments: DocumentWithOwner[];
  folders: Folder[];
  starredIds: string[];
}

/**
 * FIX 12 — WorkspaceStoreInitializer
 *
 * Client component that hydrates the Zustand workspace store with
 * server-fetched initial data. Runs once on workspace layout mount.
 *
 * Pattern: Server component fetches → passes as props → this client
 * component initializes the store → all children read from store.
 */
export function WorkspaceStoreInitializer({
  documents,
  sharedDocuments,
  folders,
  starredIds,
}: WorkspaceStoreInitializerProps) {
  const { setDocuments, setSharedDocuments, setFolders, setStarredIds, setHydrated } =
    useWorkspaceStore();

  useEffect(() => {
    setDocuments(documents);
    setSharedDocuments(sharedDocuments);
    setFolders(folders);
    setStarredIds(new Set(starredIds));
    setHydrated(true);
  }, []); // Run once on mount — Realtime keeps it updated after this

  return null; // No UI — pure side-effect component
}
