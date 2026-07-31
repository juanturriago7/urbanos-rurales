import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient singleton para TanStack Query.
 * Configuración global de caché y revalidación.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutos antes de considerar datos obsoletos
      gcTime: 1000 * 60 * 10,      // 10 minutos en caché tras ser no observado
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
