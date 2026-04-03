'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createProvider, destroyProvider, getProvider } from '@/lib/yjs/provider';
import {
  setAwarenessState,
  onAwarenessChange,
  type AwarenessUser,
  type AwarenessState,
} from '@/lib/yjs/awareness';
import { usePresenceStore } from '@/store/presenceStore';
import type { ConnectionStatus } from '@syncdoc/types';

interface UsePresenceOptions {
  documentId: string;
  user: AwarenessUser;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export function usePresence({ documentId, user, onStatusChange }: UsePresenceOptions) {
  const { setUsers, reset: clearUsers } = usePresenceStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const provider = getProvider(documentId);
    if (!provider) return;

    // Set local awareness
    setAwarenessState(provider, user);

    // Listen for awareness changes
    cleanupRef.current = onAwarenessChange(provider, (states) => {
      setUsers(states);
    });

    return () => {
      cleanupRef.current?.();
      clearUsers();
    };
  }, [documentId, user.id]);

  const updateCursor = useCallback(
    (anchor: number, head: number) => {
      const provider = getProvider(documentId);
      if (!provider) return;
      setAwarenessState(provider, user, { anchor, head });
    },
    [documentId, user]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const provider = getProvider(documentId);
      if (!provider) return;
      setAwarenessState(provider, user, null, isTyping);
    },
    [documentId, user]
  );

  return { updateCursor, setTyping };
}
