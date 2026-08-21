import { apiClient } from '@/shared/lib/axios'

export interface CrearCategoriaInput {
  nombre: string
  orden?: number
}

export interface ActualizarCategoriaInput {
  id: number
  nombre: string
  orden: number
  activo: boolean
}

export interface CrearCaracteristicaInput {
  categoriaId: number
  nombre: string
  tipoValor: 'booleano' | 'numero' | 'texto'
  filtrable: boolean
  icono?: string | null
}

export interface ActualizarCaracteristicaInput {
  id: number
  nombre: string
  tipoValor: 'booleano' | 'numero' | 'texto'
  filtrable: boolean
  icono?: string | null
  activo: boolean
}

export async function crearCategoria(input: CrearCategoriaInput): Promise<{ id: number }> {
  const { data } = await apiClient.post('/api/admin/catalogos/caracteristicas/categorias', input)
  return data
}

export async function actualizarCategoria(input: ActualizarCategoriaInput): Promise<void> {
  await apiClient.put(`/api/admin/catalogos/caracteristicas/categorias/${input.id}`, input)
}

export async function crearCaracteristica(input: CrearCaracteristicaInput): Promise<{ id: number }> {
  const { data } = await apiClient.post('/api/admin/catalogos/caracteristicas', input)
  return data
}

export async function actualizarCaracteristica(input: ActualizarCaracteristicaInput): Promise<void> {
  await apiClient.put(`/api/admin/catalogos/caracteristicas/${input.id}`, input)
}
