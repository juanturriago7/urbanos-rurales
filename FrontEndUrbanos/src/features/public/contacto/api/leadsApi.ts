import { apiClient } from '@/shared/lib/axios'

/**
 * Captura pública de leads (POST /api/leads). Sin autenticación.
 * Contrato: Task/BackEnd/04-contrato-api-frontend.md
 */
export interface CrearLeadInput {
  nombre: string
  correo?: string
  telefono?: string
  mensaje?: string
  origen: 'formulario_general' | 'formulario_inmueble' | 'whatsapp'
  inmuebleId?: number
  aceptoTratamientoDatos: boolean
  /** Honeypot anti-spam (RNF-023): campo oculto que solo llenan los bots. */
  sitio?: string
}

export const crearLead = async (input: CrearLeadInput): Promise<{ id: number }> => {
  const { data } = await apiClient.post<{ id: number }>('/api/leads', input)
  return data
}
