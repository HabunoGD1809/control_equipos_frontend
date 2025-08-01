import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Usuario } from '@/types/api';
import api from '@/lib/api';

// El tipo de usuario en el store será directamente el que nos da la API.
// Esto evita discrepancias. El rol que viene en /usuarios/me es el simplificado.
type UserProfile = Usuario;

type AuthState = {
   user: UserProfile | null;
   accessToken: string | null;
   refreshToken: string | null;
   isAuthenticated: boolean;
   isLoading: boolean;
};

type AuthActions = {
   setUser: (user: UserProfile | null) => void;
   setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
   logout: () => void;
   checkAuthStatus: () => Promise<void>;
};

const initialState: AuthState = {
   user: null,
   accessToken: null,
   refreshToken: null,
   isAuthenticated: false,
   isLoading: true,
};

export const useAuthStore = create<AuthState & AuthActions>()(
   persist(
      (set, get) => ({
         ...initialState,
         setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

         setTokens: (tokens) => {
            set({
               accessToken: tokens.accessToken,
               refreshToken: tokens.refreshToken,
               isAuthenticated: true
            });
            api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
         },

         logout: () => {
            set({
               user: null,
               accessToken: null,
               refreshToken: null,
               isAuthenticated: false,
               isLoading: false
            });
            delete api.defaults.headers.common['Authorization'];
         },

         checkAuthStatus: async () => {
            const token = get().accessToken;
            if (token) {
               api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
               try {
                  const response = await api.get<UserProfile>('/usuarios/me');
                  if (response.data) {
                     get().setUser(response.data);
                  } else {
                     get().logout();
                  }
               } catch {
                  get().logout();
               }
            } else {
               get().logout();
            }
            set({ isLoading: false });
         }
      }),
      {
         name: 'user-storage',
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated
         }),
      }
   )
);

const initialToken = useAuthStore.getState().accessToken;
if (initialToken) {
   api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}
