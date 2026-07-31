import { useQuery } from '@tanstack/react-query'
import { getRoles } from '@/features/admin/users/api/rolesApi'

/**
 * Hook de TanStack Query para obtener roles paginados.
 * La key incluye página para que el caché sea por-página.
 */
export const rolesQueryKeys = {
  all: ['roles'] as const,
  list: (page: number, pageSize: number) => ['roles', 'list', page, pageSize] as const,
}

export function useRoles(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: rolesQueryKeys.list(page, pageSize),
    queryFn: () => getRoles(page, pageSize),
  })
}
