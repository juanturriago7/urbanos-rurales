/**
 * Tipos compartidos que mapean exactamente las respuestas del backend.
 * Cualquier tipo de respuesta de la API vive aquí o en shared/types dentro del feature.
 */

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ProblemDetails {
  type?: string
  title: string
  status: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}
