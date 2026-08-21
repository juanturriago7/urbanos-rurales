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
  areaTerrenoM2: number | null
  areaConstruidaM2: number | null
  estrato: number | null
  destacado: boolean
  precioVenta: number | null
  precioArriendo: number | null
  imagenPortada: string | null
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
  /**
   * Filtro AND: el inmueble debe tener TODAS las características seleccionadas.
   * Vacío o undefined = sin filtro.
   */
  caracteristicaIds?: number[]
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

/**
 * Ficha pública completa (GET /api/inmuebles/{slug}). Nunca trae dirección
 * exacta ni lat/long precisas (RF-044).
 */

export interface UbicacionRefDto {
  id: number
  tipo: string
  nombre: string
  slug: string
}

export interface OperacionDto {
  id: number
  tipoOperacion: 'venta' | 'arriendo' | string
  precio: number
  cuotaAdministracion: number | null
  adminIncluida: boolean
  estado: string
  activo: boolean
}

export interface CaracteristicaValorDto {
  caracteristicaId: number
  nombre: string
  categoria: string
  valor: string | null
}

export interface ImagenDto {
  id: number
  urlCdn: string
  urlThumbnail: string | null
  formato: string
  orden: number
  esPortada: boolean
  textoAlt: string | null
}

export interface InmueblePublicoDetalleDto {
  id: number
  slug: string
  codigoReferencia: string
  titulo: string
  descripcion: string | null
  tipoInmueble: string
  tipoInmuebleId: number
  /**
   * Spec 03 — el frontend público lo usa para decidir si muestra
   * areaTerrenoM2 o areaConstruidaM2 sin tener que cargar el catálogo
   * de tipos.
   */
  esPropiedadHorizontal: boolean
  ubicacionId: number
  areaTerrenoM2: number | null
  areaConstruidaM2: number | null
  areaPrivadaM2: number | null
  youtubeUrl: string | null
  mapaEmbedUrl: string | null
  habitaciones: number
  banos: number
  parqueaderos: number
  piso: number | null
  pisosEdificio: number | null
  estrato: number | null
  antiguedad: string | null
  orientacion: string | null
  politicaMascotas: string
  amoblado: string | null
  destacado: boolean
  metaTitulo: string | null
  metaDescripcion: string | null
  creadoEn: string
  ubicacion: UbicacionRefDto[]
  operaciones: OperacionDto[]
  caracteristicas: CaracteristicaValorDto[]
  imagenes: ImagenDto[]
}

export const obtenerInmueblePorSlug = async (slug: string): Promise<InmueblePublicoDetalleDto> => {
  const { data } = await apiClient.get<InmueblePublicoDetalleDto>(
    `/api/inmuebles/${encodeURIComponent(slug)}`,
  )
  return data
}
