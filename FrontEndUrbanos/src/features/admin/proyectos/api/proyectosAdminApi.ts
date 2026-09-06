import { apiClient } from '@/shared/lib/axios'
import type { PagedResult } from '@/shared/types/api'

export type EstadoArticulo = 'borrador' | 'publicado' | 'archivado'

export interface ArticuloBlogAdmin {
  id: number
  titulo: string
  slug: string
  resumen: string | null
  contenido: string
  imagenPortadaKey: string | null
  imagenPortadaUrl: string | null
  metaTitulo: string | null
  metaDescripcion: string | null
  estado: EstadoArticulo
  autorId: number | null
  publicadoEn: string | null
  creadoEn: string
  actualizadoEn: string
}

export interface CrearArticuloInput {
  titulo: string
  contenido: string
  resumen?: string | null
  imagenPortadaUrl?: string | null
  metaTitulo?: string | null
  metaDescripcion?: string | null
}

export const listarArticulosAdmin = async (
  page = 1,
  pageSize = 20,
): Promise<PagedResult<ArticuloBlogAdmin>> => {
  const { data } = await apiClient.get<PagedResult<ArticuloBlogAdmin>>('/api/admin/blog', {
    params: { page, pageSize },
  })
  return data
}

export const obtenerArticuloAdmin = async (id: number): Promise<ArticuloBlogAdmin> => {
  const { data } = await apiClient.get<ArticuloBlogAdmin>(`/api/admin/blog/${id}`)
  return data
}

export const crearArticulo = async (input: CrearArticuloInput): Promise<{ id: number }> => {
  const { data } = await apiClient.post<{ id: number }>('/api/admin/blog', input)
  return data
}

export const actualizarArticulo = async (
  id: number,
  input: CrearArticuloInput,
): Promise<void> => {
  await apiClient.put(`/api/admin/blog/${id}`, { id, ...input })
}

export const cambiarEstadoArticulo = async (
  id: number,
  estado: EstadoArticulo,
): Promise<void> => {
  await apiClient.put(`/api/admin/blog/${id}/estado`, { estado })
}

export const eliminarArticulo = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/blog/${id}`)
}
