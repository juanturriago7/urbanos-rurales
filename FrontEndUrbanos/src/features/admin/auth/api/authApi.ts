import { apiClient } from '@/shared/lib/axios'
import type { LoginRequest, LoginResponse } from '@/shared/types/auth'

/**
 * Autenticación contra el panel admin.
 * Única capa que conoce las URLs de /api/auth — los componentes pasan por hooks.
 */

export const login = async (credenciales: LoginRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', credenciales)
  return data
}

/**
 * Revoca el refresh token en el servidor. Se deja fallar en silencio a propósito:
 * si la sesión ya expiró el backend responde 401, y aun así queremos limpiar el
 * estado local y sacar al usuario.
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/auth/logout')
  } catch {
    // La sesión local se limpia igual en el hook.
  }
}
