/**
 * Tipos del detalle admin de un inmueble y del upsert de operaciones.
 *
 * Archivo propio para que ni la capa de API ni la de schemas dependan la una
 * de la otra: `inmueblesApi.ts` importa de aquí, nunca al revés.
 */

export type EstadoInmueble = 'borrador' | 'publicado' | 'pausado' | 'archivado'
export type TipoOperacion = 'venta' | 'arriendo'
export type PoliticaMascotas = 'permitidas' | 'no_permitidas' | 'con_restricciones'
export type Amoblado = 'si' | 'no' | 'semi'

export interface OperacionDto {
  id: number
  tipoOperacion: TipoOperacion
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
  url: string
  esPortada: boolean
  orden: number
}

/** Respuesta de GET /api/admin/inmuebles/{id}. */
export interface InmuebleAdminDetalleDto {
  id: number
  codigoReferencia: string
  slug: string
  titulo: string
  descripcion: string | null
  tipoInmuebleId: number
  ubicacionId: number
  direccionExacta: string
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
  politicaMascotas: PoliticaMascotas
  amoblado: Amoblado | null
  matriculaInmobiliaria: string | null
  estado: EstadoInmueble
  destacado: boolean
  metaTitulo: string | null
  metaDescripcion: string | null
  asesorId: number | null
  creadoEn: string
  actualizadoEn: string
  operaciones: OperacionDto[]
  caracteristicas: CaracteristicaValorDto[]
  imagenes: ImagenDto[]
}

/** Body de PUT /api/admin/inmuebles/{id}/operaciones — UNA operación por llamada. */
export interface UpsertOperacionInput {
  tipoOperacion: TipoOperacion
  precio: number
  cuotaAdministracion?: number | null
  adminIncluida: boolean
  estado?: string | null
  activo?: boolean | null
}
