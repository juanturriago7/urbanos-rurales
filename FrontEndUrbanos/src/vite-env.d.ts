/// <reference types="vite/client" />

/**
 * Variables de entorno tipadas.
 * Agregar aquí cualquier nueva variable VITE_* para tener autocompletado y type safety.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
