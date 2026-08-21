import { apiClient } from '@/shared/lib/axios'
import type { PagedResult } from '@/shared/types/api'

/**
 * Inmuebles del panel admin. Todos los endpoints exigen JWT con rol Asesor o Admin.
 * Contrato: Task/BackEnd/04-contrato-api-frontend.md
 */

export type EstadoInmueble = 'borrador' | 'publicado' | 'pausado' | 'archivado'
export type TipoOperacion = 'venta' | 'arriendo'
export type PoliticaMascotas = 'permitidas' | 'no_permitidas' | 'con_restricciones'
export type Amoblado = 'si' | 'no' | 'semi'

export interface InmuebleAdminListItemDto {
  id: number
  codigoReferencia: string
  slug: string
  titulo: string
  tipoInmueble: string
  ubicacion: string
  estado: EstadoInmueble
  destacado: boolean
  precioVenta: number | null
  precioArriendo: number | null
  imagenPortada: string | null
  actualizadoEn: string
}

export interface OperacionInput {
  tipoOperacion: TipoOperacion
  precio: number
  cuotaAdministracion?: number | null
  adminIncluida: boolean
}

export interface CaracteristicaValorInput {
  caracteristicaId: number
  valor?: string | null
}

/** Campos editables, iguales para crear y actualizar (InmuebleDatosCommandBase). */
export interface InmuebleDatosInput {
  titulo: string
  descripcion?: string | null
  tipoInmuebleId: number
  ubicacionId: number
  direccionExacta: string
  /** Spec 03 — obligatoria si el tipo no es PH (validación cruzada en backend). */
  areaTerrenoM2?: number | null
  areaConstruidaM2?: number | null
  areaPrivadaM2?: number | null
  youtubeUrl?: string | null
  mapaEmbedUrl?: string | null
  habitaciones: number
  banos: number
  parqueaderos: number
  piso?: number | null
  pisosEdificio?: number | null
  estrato?: number | null
  antiguedad?: string | null
  orientacion?: string | null
  politicaMascotas: PoliticaMascotas
  amoblado?: Amoblado | null
  matriculaInmobiliaria?: string | null
  metaTitulo?: string | null
  metaDescripcion?: string | null
  asesorId?: number | null
  caracteristicas?: CaracteristicaValorInput[] | null
}

export interface CrearInmuebleInput extends InmuebleDatosInput {
  operaciones?: OperacionInput[] | null
}

export interface FiltroInmueblesAdmin {
  page?: number
  pageSize?: number
  estado?: EstadoInmueble
  /** Búsqueda libre por código, título o barrio. El backend la espera como `q`. */
  q?: string
}

export const getInmueblesAdmin = async (
  filtro: FiltroInmueblesAdmin = {},
): Promise<PagedResult<InmuebleAdminListItemDto>> => {
  const { data } = await apiClient.get<PagedResult<InmuebleAdminListItemDto>>(
    '/api/admin/inmuebles',
    { params: filtro },
  )
  return data
}

/** Crea el inmueble en estado borrador. Devuelve el id asignado. */
export const crearInmueble = async (input: CrearInmuebleInput): Promise<number> => {
  const { data } = await apiClient.post<{ id: number }>('/api/admin/inmuebles', input)
  return data.id
}

export const cambiarEstadoInmueble = async (
  id: number,
  estado: EstadoInmueble,
): Promise<void> => {
  await apiClient.put(`/api/admin/inmuebles/${id}/estado`, { estado })
}

export const marcarDestacado = async (id: number, destacado: boolean): Promise<void> => {
  await apiClient.put(`/api/admin/inmuebles/${id}/destacado`, { destacado })
}

export const eliminarInmueble = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/inmuebles/${id}`)
}
