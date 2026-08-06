import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { login, logout } from '@/features/admin/auth/api/authApi'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import type { ProblemDetails } from '@/shared/types/api'
import type { LoginRequest } from '@/shared/types/auth'

/**
 * Traduce un error de axios al mensaje que se le muestra al usuario.
 * El backend responde ProblemDetails (RFC 7807) con el motivo en `detail`.
 */
export function mensajeDeError(error: unknown, respaldo: string): string {
  if (isAxiosError<ProblemDetails>(error)) {
    if (!error.response) {
      return 'No se pudo contactar el servidor. ¿Está corriendo el backend?'
    }
    const { detail, title, errors } = error.response.data ?? {}

    // 400 de validación: FluentValidation devuelve los mensajes agrupados por campo.
    const primerErrorDeCampo = errors && Object.values(errors)[0]?.[0]

    return primerErrorDeCampo ?? detail ?? title ?? respaldo
  }
  return respaldo
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (credenciales: LoginRequest) => login(credenciales),
    onSuccess: (data) => setAuth(data.user, data.tokens),
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    // En settled y no en success: aunque el servidor falle, la sesión local se cierra.
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate('/admin/login', { replace: true })
    },
  })
}
