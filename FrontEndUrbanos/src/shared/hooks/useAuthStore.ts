import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, AuthTokens } from '@/shared/types/auth'

interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, tokens: AuthTokens) => void
  clearAuth: () => void
}

/**
 * Store de autenticación global.
 * Persiste en localStorage. Solo auth/UI — los datos del servidor van en TanStack Query.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => {
        localStorage.setItem('access_token', tokens.accessToken)
        localStorage.setItem('refresh_token', tokens.refreshToken)
        set({ user, tokens, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, tokens: null, isAuthenticated: false })
      },
    }),
    {
      name: 'portal-auth',
      // Solo persistir user, no tokens completos (los tokens van en localStorage directamente)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
