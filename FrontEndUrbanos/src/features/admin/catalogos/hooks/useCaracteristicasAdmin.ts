import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  actualizarCaracteristica,
  actualizarCategoria,
  crearCaracteristica,
  crearCategoria,
  type ActualizarCaracteristicaInput,
  type ActualizarCategoriaInput,
  type CrearCaracteristicaInput,
  type CrearCategoriaInput,
} from '@/features/admin/catalogos/api/caracteristicasAdminApi'

const CARACTERISTICAS_QUERY_KEY = ['catalogos', 'caracteristicas'] as const

export function useCrearCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearCategoriaInput) => crearCategoria(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARACTERISTICAS_QUERY_KEY }),
  })
}

export function useActualizarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarCategoriaInput) => actualizarCategoria(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARACTERISTICAS_QUERY_KEY }),
  })
}

export function useCrearCaracteristica() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearCaracteristicaInput) => crearCaracteristica(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARACTERISTICAS_QUERY_KEY }),
  })
}

export function useActualizarCaracteristica() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarCaracteristicaInput) => actualizarCaracteristica(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARACTERISTICAS_QUERY_KEY }),
  })
}
