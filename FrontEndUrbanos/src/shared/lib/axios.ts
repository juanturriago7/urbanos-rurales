import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * Cliente Axios singleton con interceptores de JWT y refresh automático.
 * Toda la capa de features usa este cliente, nunca axios directamente.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ─── Request interceptor: inyecta el access token ────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: manejo de errores y refresh de token ──────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

/**
 * Endpoints donde un 401 significa "credenciales inválidas", no "token expirado".
 * Sin esta excepción, un login fallido dispararía el refresh, este fallaría por no
 * haber refresh token, y el catch recargaría la página hacia /admin/login —
 * borrando el mensaje de error antes de que el usuario alcance a leerlo.
 */
const rutasSinRefresh = ['/api/auth/login', '/api/auth/refresh']

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    const esRutaDeAuth = rutasSinRefresh.some((ruta) => originalRequest?.url?.includes(ruta))

    if (error.response?.status === 401 && !originalRequest._retry && !esRutaDeAuth) {
      if (isRefreshing) {
        // Encolar requests mientras se está refrescando el token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
        )

        localStorage.setItem('access_token', data.accessToken)
        localStorage.setItem('refresh_token', data.refreshToken)

        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/admin/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
