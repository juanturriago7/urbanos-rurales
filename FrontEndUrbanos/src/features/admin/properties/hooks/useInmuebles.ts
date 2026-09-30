import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarInmueble,
  cambiarEstadoInmueble,
  crearInmueble,
  eliminarInmueble,
  getInmuebleAdmin,
  getInmueblesAdmin,
  getResumenDestacados,
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
  // Cuelga de 'inmuebles': las mutaciones que ya invalidan `all` (destacar,
  // cambiar estado, eliminar) refrescan también el contador.
  resumenDestacados: ['inmuebles', 'destacados', 'resumen'] as const,
}

export function useInmuebles(filtro: FiltroInmueblesAdmin = {}) {
  return useQuery({
    queryKey: inmueblesQueryKeys.list(filtro),
    queryFn: () => getInmueblesAdmin(filtro),
    // Evita el parpadeo a vacío al cambiar de página o de filtro.
    placeholderData: (anterior) => anterior,
  })
}

/** Contador "X/3" de destacados del listado admin (RF-078). */
export function useResumenDestacados() {
  return useQuery({
    queryKey: inmueblesQueryKeys.resumenDestacados,
    queryFn: getResumenDestacados,
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
    // onSettled, no onSuccess: un 400 también puede deberse a datos ya
    // desactualizados (otra pestaña/admin cambió el estado antes), así que el
    // listado y el contador deben refrescarse también cuando la mutación falla.
    onSettled: () => queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all }),
  })
}

export function useMarcarDestacado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, destacado }: { id: number; destacado: boolean }) =>
      marcarDestacado(id, destacado),
    // onSettled, no onSuccess: un 400 "sin cupo" (dos pestañas/admins) deja el
    // contador "X/3" y el listado desactualizados si solo refrescamos en éxito.
    onSettled: () => queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all }),
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
