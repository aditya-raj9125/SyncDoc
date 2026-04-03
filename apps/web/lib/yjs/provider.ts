import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import type { ConnectionStatus } from '@syncdoc/types';

let providers = new Map<string, HocuspocusProvider>();
let indexedDbProviders = new Map<string, IndexeddbPersistence>();

interface ProviderConfig {
  documentId: string;
  token: string;
  onStatus?: (status: ConnectionStatus) => void;
  onSynced?: () => void;
}

export function createProvider({
  documentId,
  token,
  onStatus,
  onSynced,
}: ProviderConfig): { provider: HocuspocusProvider; ydoc: Y.Doc } {
  // Reuse if already exists
  const existing = providers.get(documentId);
  if (existing) {
    return { provider: existing, ydoc: existing.document };
  }

  const ydoc = new Y.Doc();

  // Offline persistence via IndexedDB
  const idbProvider = new IndexeddbPersistence(`syncdoc-${documentId}`, ydoc);
  idbProvider.on('synced', () => {
    console.log(`[Yjs] IndexedDB synced for ${documentId}`);
  });
  indexedDbProviders.set(documentId, idbProvider);

  const wsUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || 'ws://localhost:1234';

  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: documentId,
    document: ydoc,
    token,
    connect: true,
    preserveConnection: true,
    onStatus({ status }) {
      const statusMap: Record<string, ConnectionStatus> = {
        connecting: 'connecting',
        connected: 'connected',
        disconnected: 'disconnected',
      };
      onStatus?.(statusMap[status] || 'disconnected');
    },
    onSynced({ state }) {
      if (state) {
        onSynced?.();
      }
    },
    onAuthenticationFailed({ reason }) {
      console.error('[Yjs] Authentication failed:', reason);
      onStatus?.('disconnected');
    },
    onConnect() {
      console.log(`[Yjs] Connected to collaboration server for doc: ${documentId}`);
    },
    onClose() {
      onStatus?.('disconnected');
    },
    onDisconnect({ event }) {
      console.warn(`[Yjs] Disconnected from doc ${documentId}:`, event);
    },
  });

  providers.set(documentId, provider);
  return { provider, ydoc };
}

export function destroyProvider(documentId: string) {
  const provider = providers.get(documentId);
  if (provider) {
    provider.disconnect();
    provider.destroy();
    providers.delete(documentId);
  }

  const idbProvider = indexedDbProviders.get(documentId);
  if (idbProvider) {
    idbProvider.destroy();
    indexedDbProviders.delete(documentId);
  }
}

export function getProvider(documentId: string): HocuspocusProvider | null {
  return providers.get(documentId) || null;
}
