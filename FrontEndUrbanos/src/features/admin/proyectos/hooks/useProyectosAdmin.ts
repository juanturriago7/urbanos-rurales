import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarArticulo,
  cambiarEstadoArticulo,
  crearArticulo,
  eliminarArticulo,
  listarArticulosAdmin,
  obtenerArticuloAdmin,
  type CrearArticuloInput,
  type EstadoArticulo,
} from '@/features/admin/proyectos/api/proyectosAdminApi'

export const PROYECTOS_ADMIN_QUERY_KEY = ['proyectos', 'admin'] as const
const PROYECTOS_ADMIN_ITEM_KEY = (id: number) => ['proyectos', 'admin', id] as const

export function useArticulosAdmin(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...PROYECTOS_ADMIN_QUERY_KEY, 'list', page, pageSize],
    queryFn: () => listarArticulosAdmin(page, pageSize),
  })
}

export function useArticuloAdmin(id: number | undefined) {
  return useQuery({
    queryKey: PROYECTOS_ADMIN_ITEM_KEY(id ?? 0),
    queryFn: () => obtenerArticuloAdmin(id as number),
    enabled: typeof id === 'number',
  })
}

export function useCrearArticulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearArticuloInput) => crearArticulo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROYECTOS_ADMIN_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['proyectos', 'publico'] })
    },
  })
}

export function useActualizarArticulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CrearArticuloInput }) =>
      actualizarArticulo(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: PROYECTOS_ADMIN_QUERY_KEY })
      qc.invalidateQueries({ queryKey: PROYECTOS_ADMIN_ITEM_KEY(vars.id) })
      qc.invalidateQueries({ queryKey: ['proyectos', 'publico'] })
    },
  })
}

export function useCambiarEstadoArticulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoArticulo }) =>
      cambiarEstadoArticulo(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROYECTOS_ADMIN_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['proyectos', 'publico'] })
    },
  })
}

export function useEliminarArticulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarArticulo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROYECTOS_ADMIN_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['proyectos', 'publico'] })
    },
  })
}
