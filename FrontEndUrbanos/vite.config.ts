import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// URL pública del sitio para las etiquetas Open Graph de index.html
// (%VITE_SITE_URL%). Las redes sociales solo aceptan URLs absolutas en
// og:image. Se puede sobrescribir por entorno (.env o build arg).
// Provisional: aun no hay dominio de produccion confirmado.
process.env.VITE_SITE_URL ??= 'https://urbanosrurales.com'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Sin DOM a propósito: solo se testea lógica pura (schema, mapeadores y
    // funciones de API con apiClient mockeado). Ver el spec.
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
  server: {
    port: 5173,
    // Respaldo para cuando VITE_API_BASE_URL se deja vacío y las peticiones
    // salen relativas. El destino es el puerto del perfil `http` de la API
    // (`dotnet run`); si levantas el backend con docker compose, es el 8080.
    proxy: {
      '/api': {
        target: 'http://localhost:5095',
        changeOrigin: true,
      },
    },
  },
})
