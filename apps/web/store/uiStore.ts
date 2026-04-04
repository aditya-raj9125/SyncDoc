import { create } from 'zustand';
import type { PanelType, SidebarSection } from '@syncdoc/types';

interface UIStoreState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeSection: SidebarSection;

  // Panels
  activePanel: PanelType;

  // Modals
  shareModalOpen: boolean;
  commandPaletteOpen: boolean;
  uploadModalOpen: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';
}

interface UIStoreActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setActiveSection: (section: SidebarSection) => void;

  setActivePanel: (panel: PanelType) => void;
  togglePanel: (panel: Exclude<PanelType, null>) => void;

  setShareModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setUploadModalOpen: (open: boolean) => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIStoreState & UIStoreActions>((set) => ({
  // Sidebar
  sidebarOpen: true,
  sidebarWidth: 240,
  activeSection: 'home',

  // Panels
  activePanel: null,

  // Modals
  shareModalOpen: false,
  commandPaletteOpen: false,
  uploadModalOpen: false,

  // Theme
  theme: 'system',

  // Actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(180, Math.min(320, width)) }),
  setActiveSection: (section) => set({ activeSection: section }),

  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
    })),

  setShareModalOpen: (open) => set({ shareModalOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setUploadModalOpen: (open) => set({ uploadModalOpen: open }),

  setTheme: (theme) => set({ theme }),
}));
