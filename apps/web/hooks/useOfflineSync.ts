'use client';

import { useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useEditorStore } from '@/store/editorStore';

interface UseOfflineSyncOptions {
  documentId: string;
  enabled?: boolean;
}

/**
 * Monitors online/offline status and shows appropriate UI indicators.
 * Actual offline data persistence is handled by y-indexeddb in the Yjs provider.
 */
export function useOfflineSync({ documentId, enabled = true }: UseOfflineSyncOptions) {
  const { setOffline } = useEditorStore();

  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      setOffline(false);
    };

    const handleOffline = () => {
      setOffline(true);
    };

    // Set initial state
    setOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, setOffline]);
}
