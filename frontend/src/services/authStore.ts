import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  // Regular auth token (persisted in localStorage)
  authToken: string | null;
  // Sensitive auth token (not persisted, only in memory)
  sensitiveAuthToken: string | null;

  setAuthToken: (token: string | null) => void;
  setSensitiveAuthToken: (token: string | null) => void;
  clearAllTokens: () => void;
  getAuthToken: () => string | null;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      authToken: null,
      sensitiveAuthToken: null,

      setAuthToken: (token: string | null) => set({ authToken: token }),

      setSensitiveAuthToken: (token: string | null) =>
        set({ sensitiveAuthToken: token }),

      clearAllTokens: () =>
        set({
          authToken: null,
          sensitiveAuthToken: null,
        }),

      getAuthToken: () => {
        const state = get();
        // Return sensitive token if available, otherwise regular token
        return state.sensitiveAuthToken || state.authToken;
      },

      isAuthenticated: () => {
        const state = get();
        return !!(state.sensitiveAuthToken || state.authToken);
      },
    }),
    {
      name: "auth-storage",
      // Only persist the regular auth token, not the sensitive one
      partialize: state => ({ authToken: state.authToken }),
    }
  )
);
