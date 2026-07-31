import { apiClient } from '@/shared/lib/axios'
import type { PagedResult } from '@/shared/types/api'

export interface RoleDto {
  id: number
  name: string
  description: string
  userCount: number
}

/**
 * Llama a GET /api/roles con paginación.
 * Esta función es la única que conoce la URL del endpoint — el componente no sabe nada de HTTP.
 */
export const getRoles = async (page = 1, pageSize = 20): Promise<PagedResult<RoleDto>> => {
  const { data } = await apiClient.get<PagedResult<RoleDto>>('/api/roles', {
    params: { page, pageSize },
  })
  return data
}
