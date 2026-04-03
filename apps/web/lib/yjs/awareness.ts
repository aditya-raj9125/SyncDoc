import type { HocuspocusProvider } from '@hocuspocus/provider';

export interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
}

export interface AwarenessState {
  user: AwarenessUser;
  cursor: {
    anchor: number;
    head: number;
  } | null;
  isTyping: boolean;
  lastSeen: number;
}

const AWARENESS_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#06B6D4', '#E11D48',
];

export function getAwarenessColor(clientId: number): string {
  return AWARENESS_COLORS[clientId % AWARENESS_COLORS.length];
}

export function setAwarenessState(
  provider: HocuspocusProvider,
  user: AwarenessUser,
  cursor?: { anchor: number; head: number } | null,
  isTyping = false
) {
  const awareness = provider.awareness;
  if (!awareness) return;

  const state: AwarenessState = {
    user,
    cursor: cursor ?? null,
    isTyping,
    lastSeen: Date.now(),
  };

  awareness.setLocalStateField('user', state.user);
  awareness.setLocalStateField('cursor', state.cursor);
  awareness.setLocalStateField('isTyping', state.isTyping);
  awareness.setLocalStateField('lastSeen', state.lastSeen);
}

export function getAwarenessStates(
  provider: HocuspocusProvider
): Map<number, AwarenessState> {
  const awareness = provider.awareness;
  if (!awareness) return new Map();

  const states = new Map<number, AwarenessState>();
  awareness.getStates().forEach((state, clientId) => {
    if (state.user && clientId !== awareness.clientID) {
      states.set(clientId, state as AwarenessState);
    }
  });
  return states;
}

export function onAwarenessChange(
  provider: HocuspocusProvider,
  callback: (states: Map<number, AwarenessState>) => void
): () => void {
  const awareness = provider.awareness;
  if (!awareness) return () => {};

  const handler = () => {
    callback(getAwarenessStates(provider));
  };

  awareness.on('change', handler);
  return () => awareness.off('change', handler);
}
