import { create } from 'zustand';
import type { AwarenessState } from '@syncdoc/types';

interface PresenceStoreState {
  users: Map<number, AwarenessState>;
  localClientId: number | null;
}

interface PresenceStoreActions {
  setUsers: (users: Map<number, AwarenessState>) => void;
  setLocalClientId: (id: number) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceStoreState & PresenceStoreActions>((set) => ({
  users: new Map(),
  localClientId: null,

  setUsers: (users) => set({ users }),
  setLocalClientId: (id) => set({ localClientId: id }),
  reset: () => set({ users: new Map(), localClientId: null }),
}));
