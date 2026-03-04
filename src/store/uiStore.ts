import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
   isSidebarCollapsed: boolean;
   toggleSidebar: () => void;
   setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
   persist(
      (set) => ({
         isSidebarCollapsed: false,
         toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
         setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      }),
      {
         name: 'ui-storage',
         storage: createJSONStorage(() => localStorage),
      }
   )
);
