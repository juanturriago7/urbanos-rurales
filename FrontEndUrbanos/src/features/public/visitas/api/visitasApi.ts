import { apiClient } from '@/shared/lib/axios'

/**
 * Solicitud pública de visita a un inmueble (POST /api/visitas). Sin
 * autenticación. La visita se crea en la agenda corporativa (Microsoft 365) y se
 * notifica por correo; no hay recurso que consultar después.
 */
export interface AgendarVisitaInput {
  inmuebleId: number
  nombre: string
  correo: string
  telefono?: string | null
  /** Fecha local de Colombia, "yyyy-MM-dd". */
  fecha: string
  /** Inicio del slot de 1 hora, "HH:mm". */
  franja: string
  mensaje?: string | null
  aceptoTratamientoDatos: boolean
  /** Honeypot anti-spam: campo oculto que solo llenan los bots. */
  sitio?: string
}

export interface AgendarVisitaResponse {
  agendada: boolean
  /** Fecha y hora local confirmada del slot (ISO sin zona). */
  inicioLocal: string
}

export const agendarVisita = async (
  input: AgendarVisitaInput,
): Promise<AgendarVisitaResponse> => {
  const { data } = await apiClient.post<AgendarVisitaResponse>('/api/visitas', input)
  return data
}

/** Horario de atención de visitas — reflejo de ReglasAgenda en el backend. */
const JORNADA: Record<number, [number, number]> = {
  1: [8, 18], // lunes
  2: [8, 18],
  3: [8, 18],
  4: [8, 18],
  5: [8, 18],
  6: [9, 13], // sábado
}

/** Slots "HH:mm" disponibles para una fecha ("yyyy-MM-dd"); vacío si no se atiende. */
export const franjasDisponibles = (fecha: string): string[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return []
  const [y, m, d] = fecha.split('-').map(Number)
  const dia = new Date(y, m - 1, d).getDay()
  const jornada = JORNADA[dia]
  if (!jornada) return []
  const [desde, hasta] = jornada
  return Array.from({ length: hasta - desde }, (_, i) => `${String(desde + i).padStart(2, '0')}:00`)
}
