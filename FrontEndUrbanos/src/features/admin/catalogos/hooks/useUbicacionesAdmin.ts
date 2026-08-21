import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/axios'
import {
  actualizarUbicacion,
  crearUbicacion,
  type ActualizarUbicacionInput,
  type CrearUbicacionInput,
} from '@/features/admin/catalogos/api/ubicacionesAdminApi'
import type { UbicacionDto } from '@/features/admin/catalogos/api/catalogosApi'

/**
 * Query key del árbol público (la misma que usa `useUbicaciones()` en
 * `useCatalogos.ts`). El panel admin debe invalidarla también al mutar
 * para que el selector de `/admin/properties/nuevo` vea los cambios sin
 * recargar — consume la misma lectura pública.
 */
const UBICACIONES_QUERY_KEY = ['catalogos', 'ubicaciones'] as const

/**
 * Query key del árbol admin (incluye inactivos). Separada para no
 * confundir al consumidor con un árbol filtrado que no aplica.
 */
export const UBICACIONES_ADMIN_QUERY_KEY = ['catalogos', 'ubicaciones', 'admin'] as const

async function getUbicacionesAdmin(): Promise<UbicacionDto[]> {
  const { data } = await apiClient.get<UbicacionDto[]>('/api/admin/catalogos/ubicaciones')
  return data
}

export function useUbicacionesAdmin() {
  return useQuery({
    queryKey: UBICACIONES_ADMIN_QUERY_KEY,
    queryFn: getUbicacionesAdmin,
    staleTime: 0,
  })
}

export function useCrearUbicacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearUbicacionInput) => crearUbicacion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UBICACIONES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: UBICACIONES_ADMIN_QUERY_KEY })
    },
  })
}

export function useActualizarUbicacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarUbicacionInput) => actualizarUbicacion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UBICACIONES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: UBICACIONES_ADMIN_QUERY_KEY })
    },
  })
}
