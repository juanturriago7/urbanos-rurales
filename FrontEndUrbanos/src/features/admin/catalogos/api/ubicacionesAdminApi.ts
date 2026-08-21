import { apiClient } from '@/shared/lib/axios'

export interface CrearUbicacionInput {
  tipo: 'zona' | 'localidad' | 'upz' | 'barrio'
  nombre: string
  padreId: number | null
}

export interface ActualizarUbicacionInput {
  id: number
  nombre: string
  padreId: number | null
  activo: boolean
  desactivarHijos?: boolean
}

export async function crearUbicacion(input: CrearUbicacionInput): Promise<{ id: number }> {
  const { data } = await apiClient.post('/admin/catalogos/ubicaciones', input)
  return data
}

export async function actualizarUbicacion(input: ActualizarUbicacionInput): Promise<void> {
  await apiClient.put(`/admin/catalogos/ubicaciones/${input.id}`, input)
}
