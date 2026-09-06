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
  ubicacionId?: number
  precioMin?: number
  precioMax?: number
  areaMin?: number
  areaMax?: number
  habitaciones?: number
  banos?: number
  parqueaderos?: number
  estrato?: number
  mascotas?: boolean
  adminIncluida?: boolean
  /**
   * Filtro AND: el inmueble debe tener TODAS las características seleccionadas.
   * Vacío o undefined = sin filtro.
   */
  caracteristicaIds?: number[]
  q?: string
  orden?: string
  page?: number
  pageSize?: number
}

/**
 * GET /api/inmuebles espera query params en snake_case explícito
 * (InmueblesController usa [FromQuery(Name = "...")] en varios de ellos) —
 * mandar el objeto de filtro tal cual en camelCase hace que el backend nunca
 * los reciba (ubicacion_id, precio_min, precio_max, area_min, area_max,
 * admin_incluida, caracteristica_ids) y el filtro se ignora en silencio.
 * Este mapeo es la única fuente de verdad de esos nombres en el frontend.
 */
function aQuerySnakeCase(filtro: FiltroInmueblesPublico): Record<string, unknown> {
  return {
    operacion: filtro.operacion,
    tipo: filtro.tipo,
    ubicacion_id: filtro.ubicacionId,
    precio_min: filtro.precioMin,
    precio_max: filtro.precioMax,
    area_min: filtro.areaMin,
    area_max: filtro.areaMax,
    habitaciones: filtro.habitaciones,
    banos: filtro.banos,
    parqueaderos: filtro.parqueaderos,
    estrato: filtro.estrato,
    mascotas: filtro.mascotas,
    admin_incluida: filtro.adminIncluida,
    caracteristica_ids: filtro.caracteristicaIds,
    q: filtro.q,
    orden: filtro.orden,
    page: filtro.page,
    pageSize: filtro.pageSize,
  }
}

/**
 * El serializador por defecto de axios manda un array como
 * `caracteristica_ids[]=1&caracteristica_ids[]=2` (notación de corchetes) —
 * el model binding de ASP.NET Core para `int[]?` NO reconoce esa notación por
 * defecto, solo la clave repetida sin corchetes. Se serializa a mano por eso,
 * y de paso se omiten claves vacías/undefined en vez de mandarlas como
 * `clave=` (que sí llegaría, pero como string vacío en vez de ausente).
 */
function serializarQuery(params: Record<string, unknown>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, String(v)))
    } else {
      query.append(key, String(value))
    }
  }
  return query.toString()
}

export const buscarInmuebles = async (
  filtro: FiltroInmueblesPublico = {},
): Promise<PagedResult<InmueblePublicoListItemDto>> => {
  const { data } = await apiClient.get<PagedResult<InmueblePublicoListItemDto>>('/api/inmuebles', {
    params: aQuerySnakeCase(filtro),
    paramsSerializer: serializarQuery,
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
