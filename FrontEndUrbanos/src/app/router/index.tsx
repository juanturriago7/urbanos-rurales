import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AuthGuard } from '@/app/router/AuthGuard'

// ─── Páginas públicas ─────────────────────────────────────────────────────────
import { HomePage } from '@/features/public/properties/pages/HomePage'
import { InmueblesListPage } from '@/features/public/properties/pages/InmueblesListPage'
import { InmuebleDetallePage } from '@/features/public/properties/pages/InmuebleDetallePage'

// ─── Páginas admin ────────────────────────────────────────────────────────────
import { LoginPage } from '@/features/admin/auth/pages/LoginPage'
import { DashboardPage } from '@/features/admin/dashboard/pages/DashboardPage'
import { RolesPage } from '@/features/admin/users/pages/RolesPage'
import { InmueblesPage } from '@/features/admin/properties/pages/InmueblesPage'
import { InmuebleFormPage } from '@/features/admin/properties/pages/InmuebleFormPage'

const router = createBrowserRouter([
  // ─── Rutas públicas ──────────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'inmuebles', element: <InmueblesListPage /> },
      { path: 'inmuebles/:slug', element: <InmuebleDetallePage /> },
      { path: 'properties', element: <div className="p-8">Propiedades — próximamente</div> },
      { path: 'search', element: <div className="p-8">Búsqueda — próximamente</div> },
    ],
  },

  // ─── Login (sin layout admin) ─────────────────────────────────────────────
  { path: '/admin/login', element: <LoginPage /> },

  // ─── Rutas admin (protegidas) ─────────────────────────────────────────────
  {
    path: '/admin',
    element: <AuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          // Una ruta no puede ser índice y tener path a la vez: React Router
          // ignora el flag y la registra solo como '/admin/dashboard', dejando
          // '/admin' sin nada que renderizar en el Outlet (pantalla en blanco).
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'properties', element: <InmueblesPage /> },
          { path: 'properties/nuevo', element: <InmuebleFormPage /> },
          { path: 'leads', element: <div className="p-4">Leads</div> },
          { path: 'media', element: <div className="p-4">Multimedia</div> },
          { path: 'users', element: <RolesPage /> },
        ],
      },
    ],
  },

  // ─── 404 ──────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div className="flex h-screen items-center justify-center font-sans">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-brand-600">404</h1>
          <p className="mt-2 text-text-secondary">Página no encontrada</p>
        </div>
      </div>
    ),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
