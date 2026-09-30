import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_')
  // URL pública para las etiquetas Open Graph de index.html (%VITE_SITE_URL%).
  // Prioridad: variable de proceso (Docker ENV / CLI) > .env* > valor provisional.
  // loadEnv ya sobreescribe con process.env las claves con prefijo VITE_ después
  // de leer los .env* (ver vite/dist/node/chunks/node.js, función loadEnv), así
  // que env.VITE_SITE_URL solo ya respeta esa prioridad.
  // Vacía cuenta como no definida y se quita la barra final.
  // Provisional: aún no hay dominio de producción confirmado.
  process.env.VITE_SITE_URL = (env.VITE_SITE_URL || 'https://urbanosrurales.com').replace(
    /\/+$/,
    '',
  )

  return {
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
  }
})
