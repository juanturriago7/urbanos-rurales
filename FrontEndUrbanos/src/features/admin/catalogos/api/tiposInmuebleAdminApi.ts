import { apiClient } from '@/shared/lib/axios'

export interface CrearTipoInmuebleInput {
  nombre: string
  esPropiedadHorizontal: boolean
  orden?: number
}

export interface ActualizarTipoInmuebleInput {
  id: number
  nombre: string
  esPropiedadHorizontal: boolean
  activo: boolean
  orden?: number
}

export async function crearTipoInmueble(input: CrearTipoInmuebleInput): Promise<{ id: number }> {
  const { data } = await apiClient.post('/api/admin/catalogos/tipos-inmueble', input)
  return data
}

export async function actualizarTipoInmueble(input: ActualizarTipoInmuebleInput): Promise<void> {
  await apiClient.put(`/api/admin/catalogos/tipos-inmueble/${input.id}`, input)
}
