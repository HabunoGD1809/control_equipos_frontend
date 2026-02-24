import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Usuario } from '@/types/api';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: Usuario) => void;
  logout: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      logout: () => {
        set({ user: null, isAuthenticated: false });

        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },

      setInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
