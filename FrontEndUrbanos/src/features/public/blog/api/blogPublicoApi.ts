import { apiClient } from '@/shared/lib/axios'
import type { PagedResult } from '@/shared/types/api'

export interface ArticuloBlogListItem {
  id: number
  titulo: string
  slug: string
  resumen: string | null
  imagenPortadaUrl: string | null
  autorNombre: string | null
  publicadoEn: string | null
}

export interface ArticuloBlogDetalle {
  id: number
  titulo: string
  slug: string
  resumen: string | null
  contenido: string
  imagenPortadaUrl: string | null
  metaTitulo: string | null
  metaDescripcion: string | null
  autorNombre: string | null
  publicadoEn: string | null
  creadoEn: string
}

export const listarArticulosPublico = async (
  page = 1,
  pageSize = 9,
): Promise<PagedResult<ArticuloBlogListItem>> => {
  const { data } = await apiClient.get<PagedResult<ArticuloBlogListItem>>('/api/blog', {
    params: { page, pageSize },
  })
  return data
}

export const obtenerArticuloPorSlug = async (slug: string): Promise<ArticuloBlogDetalle> => {
  const { data } = await apiClient.get<ArticuloBlogDetalle>(`/api/blog/${encodeURIComponent(slug)}`)
  return data
}
