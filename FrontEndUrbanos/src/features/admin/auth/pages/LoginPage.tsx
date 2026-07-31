import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { Button } from '@/shared/components/ui/Button'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

/**
 * Página de login para el panel admin.
 * Usa React Hook Form + Zod para validación.
 * TODO: conectar con el endpoint POST /api/auth/login cuando esté implementado.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    try {
      // TODO: reemplazar con llamada real a POST /api/auth/login
      // const response = await apiClient.post<LoginResponse>('/api/auth/login', data)
      // setAuth(response.data.user, response.data.tokens)

      // Mock temporal para que el scaffolding sea navegable
      console.log('Login con:', data)
      setAuth(
        { id: '1', email: data.email, fullName: 'Usuario Demo', role: 'Admin' },
        { accessToken: 'mock-token', refreshToken: 'mock-refresh', expiresIn: 3600 },
      )
      navigate(from, { replace: true })
    } catch {
      setError('root', { message: 'Credenciales incorrectas' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted font-sans">
      <div className="w-full max-w-md rounded-[--radius-card] bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-text-primary">Acceso Admin</h1>
        <p className="mt-1 text-sm text-text-secondary">Portal Urbanos — Panel de gestión</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-error">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  )
}
