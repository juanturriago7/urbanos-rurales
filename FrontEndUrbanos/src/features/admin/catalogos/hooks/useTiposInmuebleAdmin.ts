import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  actualizarTipoInmueble,
  crearTipoInmueble,
  type ActualizarTipoInmuebleInput,
  type CrearTipoInmuebleInput,
} from '@/features/admin/catalogos/api/tiposInmuebleAdminApi'

const TIPOS_INMUEBLE_QUERY_KEY = ['catalogos', 'tipos-inmueble'] as const

export function useCrearTipoInmueble() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearTipoInmuebleInput) => crearTipoInmueble(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIPOS_INMUEBLE_QUERY_KEY }),
  })
}

export function useActualizarTipoInmueble() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarTipoInmuebleInput) => actualizarTipoInmueble(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIPOS_INMUEBLE_QUERY_KEY }),
  })
}
