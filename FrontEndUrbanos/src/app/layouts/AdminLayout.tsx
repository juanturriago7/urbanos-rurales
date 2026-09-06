import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { useLogout } from '@/features/admin/auth/hooks/useLogin'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/properties', label: 'Propiedades' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/media', label: 'Multimedia' },
  { to: '/admin/users', label: 'Usuarios' },
  { to: '/admin/catalogos/ubicaciones', label: 'Ubicaciones' },
  { to: '/admin/catalogos/tipos-inmueble', label: 'Tipos de inmueble' },
  { to: '/admin/catalogos/caracteristicas', label: 'Características' },
  { to: '/admin/proyectos', label: 'Proyectos' },
]

/**
 * Layout del panel de administración.
 * Sidebar + topbar + contenido. Solo accesible para usuarios autenticados (ver AuthGuard).
 */
export function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const { mutate: cerrarSesion, isPending: cerrandoSesion } = useLogout()

  // Revoca el refresh token en el servidor además de limpiar el estado local;
  // el hook navega a /admin/login pase lo que pase.
  const handleLogout = () => cerrarSesion()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted font-sans">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-white shadow-sm md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/admin/dashboard" className="text-lg font-bold text-brand-700">
            Portal Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {/* User info */}
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium text-text-primary">{user?.fullName}</p>
          <p className="text-xs text-text-secondary">{user?.role}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6 shadow-sm">
          <h1 className="text-base font-semibold text-text-primary">Panel de Administración</h1>
          <button
            onClick={handleLogout}
            disabled={cerrandoSesion}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary disabled:opacity-60"
          >
            {cerrandoSesion ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
