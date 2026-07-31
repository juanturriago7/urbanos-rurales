import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/queryClient'
import type { ReactNode } from 'react'

/**
 * Árbol de providers globales.
 * Agregar aquí cualquier nuevo provider (toasts, temas, etc.).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
