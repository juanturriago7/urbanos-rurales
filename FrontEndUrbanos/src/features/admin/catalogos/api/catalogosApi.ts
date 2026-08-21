import { apiClient } from '@/shared/lib/axios'

/** Catálogos públicos que alimentan los selects del panel. No requieren token. */

export interface TipoInmuebleDto {
  id: number
  nombre: string
  slug: string
  /**
   * Si true, el tipo es una unidad dentro de un edificio/conjunto con áreas
   * comunes administradas (apartamento, oficina, local). La spec 03 lo usa
   * para mostrar/ocultar el campo "área de terreno" en la ficha del inmueble.
   */
  esPropiedadHorizontal: boolean
  /** Si false, el tipo existe pero no se ofrece en selectores públicos. */
  activo: boolean
}

/**
 * Árbol zona → localidad → upz. Los barrios no viajan aquí (son miles una vez
 * cargado el dato real de Bogotá): se resuelven por nombre con `buscarUbicaciones`.
 *
 * `padreId` y `activo` los expone el backend; el árbol público solo trae activos,
 * pero el tipo los modela desde el inicio para que el panel admin (que reutiliza
 * este shape vía el endpoint `GET /api/admin/catalogos/ubicaciones`) pueda ver y
 * operar nodos desactivados sin un segundo tipo paralelo.
 */
export interface UbicacionDto {
  id: number
  tipo: 'zona' | 'localidad' | 'upz' | 'barrio'
  nombre: string
  slug: string
  padreId: number | null
  activo: boolean
  hijos: UbicacionDto[]
}

/** Resultado de búsqueda por nombre (incluye barrios), con la ruta completa para mostrar contexto. */
export interface UbicacionBusquedaDto {
  id: number
  tipo: 'zona' | 'localidad' | 'upz' | 'barrio'
  nombre: string
  slug: string
  rutaCompleta: string
}

export interface CaracteristicaDto {
  id: number
  nombre: string
  icono: string | null
  tipoValor: 'booleano' | 'numero' | 'texto'
  filtrable: boolean
  /** Si false, la característica existe pero no se ofrece en selectores públicos. */
  activo: boolean
}

export interface CategoriaCaracteristicaDto {
  id: number
  nombre: string
  caracteristicas: CaracteristicaDto[]
}

export const getTiposInmueble = async (): Promise<TipoInmuebleDto[]> => {
  const { data } = await apiClient.get<TipoInmuebleDto[]>('/api/catalogos/tipos-inmueble')
  return data
}

export const getUbicaciones = async (): Promise<UbicacionDto[]> => {
  const { data } = await apiClient.get<UbicacionDto[]>('/api/catalogos/ubicaciones')
  return data
}

/** Búsqueda por nombre para el combobox de ubicación (debounced en el hook). */
export const buscarUbicaciones = async (termino: string): Promise<UbicacionBusquedaDto[]> => {
  const { data } = await apiClient.get<UbicacionBusquedaDto[]>('/api/catalogos/ubicaciones/buscar', {
    params: { q: termino },
  })
  return data
}

export const getCaracteristicas = async (): Promise<CategoriaCaracteristicaDto[]> => {
  const { data } = await apiClient.get<CategoriaCaracteristicaDto[]>('/api/catalogos/caracteristicas')
  return data
}

/**
 * Aplana el árbol de ubicaciones para un `<select>`, indentando por nivel.
 * El inmueble se asocia a la ubicación más específica, así que todos los niveles
 * son seleccionables.
 */
export interface OpcionUbicacion {
  id: number
  etiqueta: string
  nivel: number
}

export function aplanarUbicaciones(nodos: UbicacionDto[], nivel = 0): OpcionUbicacion[] {
  return nodos.flatMap((nodo) => [
    { id: nodo.id, etiqueta: `${'  '.repeat(nivel)}${nodo.nombre}`, nivel },
    ...aplanarUbicaciones(nodo.hijos ?? [], nivel + 1),
  ])
}
