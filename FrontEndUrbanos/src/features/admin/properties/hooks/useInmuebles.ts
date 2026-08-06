import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoInmueble,
  crearInmueble,
  eliminarInmueble,
  getInmueblesAdmin,
  marcarDestacado,
  type CrearInmuebleInput,
  type EstadoInmueble,
  type FiltroInmueblesAdmin,
} from '@/features/admin/properties/api/inmueblesApi'

export const inmueblesQueryKeys = {
  all: ['inmuebles'] as const,
  list: (filtro: FiltroInmueblesAdmin) => ['inmuebles', 'list', filtro] as const,
}

export function useInmuebles(filtro: FiltroInmueblesAdmin = {}) {
  return useQuery({
    queryKey: inmueblesQueryKeys.list(filtro),
    queryFn: () => getInmueblesAdmin(filtro),
    // Evita el parpadeo a vacío al cambiar de página o de filtro.
    placeholderData: (anterior) => anterior,
  })
}

export function useCrearInmueble() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CrearInmuebleInput) => crearInmueble(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all }),
  })
}

export function useCambiarEstado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoInmueble }) =>
      cambiarEstadoInmueble(id, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all }),
  })
}

export function useMarcarDestacado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, destacado }: { id: number; destacado: boolean }) =>
      marcarDestacado(id, destacado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all }),
  })
}

export function useEliminarInmueble() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => eliminarInmueble(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all }),
  })
}
