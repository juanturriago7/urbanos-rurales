import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

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
