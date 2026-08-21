import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  actualizarUbicacion,
  crearUbicacion,
  type ActualizarUbicacionInput,
  type CrearUbicacionInput,
} from '@/features/admin/catalogos/api/ubicacionesAdminApi'

// Misma query key que usa useUbicaciones() en useCatalogos.ts — verificar el
// nombre exacto en ese archivo antes de copiar (no se confirmó en esta tarea).
const UBICACIONES_QUERY_KEY = ['catalogos', 'ubicaciones']

export function useCrearUbicacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearUbicacionInput) => crearUbicacion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: UBICACIONES_QUERY_KEY }),
  })
}

export function useActualizarUbicacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarUbicacionInput) => actualizarUbicacion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: UBICACIONES_QUERY_KEY }),
  })
}
