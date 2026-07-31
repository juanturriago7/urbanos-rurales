import { Outlet, Link } from 'react-router-dom'

/**
 * Layout del sitio público.
 * Navbar simple + contenido + footer.
 * Las páginas públicas (listings, búsqueda) renderizan aquí via <Outlet />.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-text-primary">
      {/* Navbar público */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold text-brand-700">
            Portal Urbanos
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link to="/properties" className="text-text-secondary hover:text-text-primary transition-colors">
              Propiedades
            </Link>
            <Link to="/search" className="text-text-secondary hover:text-text-primary transition-colors">
              Buscar
            </Link>
          </nav>
          <Link
            to="/admin"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Acceso Admin
          </Link>
        </div>
      </header>

      {/* Contenido de la página */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-muted py-8 text-center text-sm text-text-secondary">
        © {new Date().getFullYear()} Portal Urbanos. Todos los derechos reservados.
      </footer>
    </div>
  )
}
