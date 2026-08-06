import { defineConfig } from 'vite'
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
