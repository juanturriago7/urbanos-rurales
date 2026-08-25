import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarInmueble,
  cambiarEstadoInmueble,
  crearInmueble,
  eliminarInmueble,
  getInmuebleAdmin,
  getInmueblesAdmin,
  marcarDestacado,
  upsertOperacion,
  type CrearInmuebleInput,
  type EstadoInmueble,
  type FiltroInmueblesAdmin,
  type InmuebleDatosInput,
  type UpsertOperacionInput,
} from '@/features/admin/properties/api/inmueblesApi'

export const inmueblesQueryKeys = {
  all: ['inmuebles'] as const,
  list: (filtro: FiltroInmueblesAdmin) => ['inmuebles', 'list', filtro] as const,
  detalle: (id: number) => ['inmuebles', 'detalle', id] as const,
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

export function useInmueble(id: number | undefined) {
  return useQuery({
    queryKey: inmueblesQueryKeys.detalle(id ?? 0),
    queryFn: () => getInmuebleAdmin(id!),
    enabled: typeof id === 'number' && Number.isFinite(id) && id > 0,
  })
}

export function useActualizarInmueble() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      datos,
      operaciones,
    }: {
      id: number
      datos: InmuebleDatosInput
      operaciones: UpsertOperacionInput[]
    }) => {
      // Secuencial a propósito: si los campos fallan, no se tocan las
      // operaciones y el registro no queda a medias.
      await actualizarInmueble(id, datos)
      for (const operacion of operaciones) {
        await upsertOperacion(id, operacion)
      }
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.detalle(id) })
    },
  })
}
