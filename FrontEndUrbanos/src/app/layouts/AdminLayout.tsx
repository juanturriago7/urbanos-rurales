import { useEffect, useState } from 'react'
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

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
  ].join(' ')

/**
 * Layout del panel de administración.
 * Sidebar + topbar + contenido. Solo accesible para usuarios autenticados (ver AuthGuard).
 * En pantallas < md el sidebar se oculta y la navegación se ofrece en un drawer modal
 * accesible desde el botón de menú de la topbar.
 */
export function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const { mutate: cerrarSesion, isPending: cerrandoSesion } = useLogout()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Revoca el refresh token en el servidor además de limpiar el estado local;
  // el hook navega a /admin/login pase lo que pase.
  const handleLogout = () => cerrarSesion()

  const cerrarMenu = () => setMenuAbierto(false)

  // Bloquea el scroll del body y cierra con Escape mientras el drawer está abierto.
  useEffect(() => {
    if (!menuAbierto) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [menuAbierto])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted font-sans">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-col border-r border-border bg-white shadow-sm md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/admin/dashboard" className="text-lg font-bold text-brand-700">
            Portal Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
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

      {/* Drawer de navegación (mobile) */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cerrarMenu}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col bg-white shadow-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Link
                to="/admin/dashboard"
                onClick={cerrarMenu}
                className="text-lg font-bold text-brand-700"
              >
                Portal Admin
              </Link>
              <button
                type="button"
                onClick={cerrarMenu}
                aria-label="Cerrar menú"
                className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map(({ to, label }) => (
                <NavLink key={to} to={to} onClick={cerrarMenu} className={navLinkClass}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <p className="truncate text-sm font-medium text-text-primary">{user?.fullName}</p>
              <p className="text-xs text-text-secondary">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-white px-4 shadow-sm md:px-6">
          <div className="flex items-center gap-2">
            {/* Botón de menú (mobile) */}
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-muted hover:text-text-primary md:hidden"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-text-primary">Panel de Administración</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={cerrandoSesion}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary disabled:opacity-60"
          >
            {cerrandoSesion ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
