import type {
  DestacadosResumenDto,
  EstadoInmueble,
} from '@/features/admin/properties/api/inmueblesApi'

/**
 * Regla del botón "Destacar" del listado admin (RF-078). Replica en la UI lo que
 * valida el backend (MarcarDestacadoCommandHandler) para explicar el bloqueo antes
 * del clic. El backend sigue siendo la autoridad.
 */

export const MENSAJE_SOLO_PUBLICADOS = 'Solo los inmuebles publicados pueden destacarse.'

export function mensajeSinCupo(maximo: number): string {
  return `Máximo ${maximo} inmuebles destacados. Quita uno para destacar otro.`
}

export interface EstadoBotonDestacar {
  deshabilitado: boolean
  /** Por qué está deshabilitado; va al tooltip. `null` si está habilitado. */
  motivo: string | null
}

const HABILITADO: EstadoBotonDestacar = { deshabilitado: false, motivo: null }

export function estadoBotonDestacar(
  inmueble: { estado: EstadoInmueble; destacado: boolean },
  resumen: DestacadosResumenDto | undefined,
): EstadoBotonDestacar {
  // Quitar el destacado siempre se permite: es la forma de liberar cupo.
  if (inmueble.destacado) return HABILITADO

  if (inmueble.estado !== 'publicado') {
    return { deshabilitado: true, motivo: MENSAJE_SOLO_PUBLICADOS }
  }

  // Sin resumen (cargando o con error) no se bloquea: el backend valida igual.
  if (resumen && resumen.total >= resumen.maximo) {
    return { deshabilitado: true, motivo: mensajeSinCupo(resumen.maximo) }
  }

  return HABILITADO
}
