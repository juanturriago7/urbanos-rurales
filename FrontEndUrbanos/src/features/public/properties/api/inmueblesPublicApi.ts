import { apiClient } from '@/shared/lib/axios'
import type { PagedResult } from '@/shared/types/api'

/**
 * Búsqueda pública de inmuebles (GET /api/inmuebles). Sin autenticación.
 * Contrato: Task/BackEnd/04-contrato-api-frontend.md
 */

export interface InmueblePublicoListItemDto {
  id: number
  slug: string
  codigoReferencia: string
  titulo: string
  tipoInmueble: string
  ubicacion: string
  habitaciones: number
  banos: number
  parqueaderos: number
  areaConstruidaM2: number | null
  estrato: number | null
  destacado: boolean
  precioVenta: number | null
  precioArriendo: number | null
  imagenPortada: string | null
  latitudAproximada: number | null
  longitudAproximada: number | null
}

export interface FiltroInmueblesPublico {
  operacion?: 'venta' | 'arriendo'
  tipo?: string
  precioMin?: number
  precioMax?: number
  areaMin?: number
  areaMax?: number
  habitaciones?: number
  banos?: number
  page?: number
  pageSize?: number
}

export const buscarInmuebles = async (
  filtro: FiltroInmueblesPublico = {},
): Promise<PagedResult<InmueblePublicoListItemDto>> => {
  const { data } = await apiClient.get<PagedResult<InmueblePublicoListItemDto>>('/api/inmuebles', {
    params: filtro,
  })
  return data
}
