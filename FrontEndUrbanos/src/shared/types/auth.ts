/** Los roles son fijos: viven en el enum RolUsuario del backend, no en una tabla editable. */
export type UserRole = 'Admin' | 'Asesor'

export interface AuthUser {
  /** BIGSERIAL en la base; el backend lo serializa como número. */
  id: number
  email: string
  fullName: string
  role: UserRole
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
}
