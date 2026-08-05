import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { MobileDrawer } from '@/app/layouts/public/MobileDrawer'
import { NavLinks } from '@/app/layouts/public/NavLinks'
import { clasesBoton } from '@/shared/components/ui/Button'
import { Container } from '@/shared/components/ui/Container'
import { Logo } from '@/shared/components/ui/Logo'

/**
 * Cabecera del sitio público, con dos modos.
 *
 * En la landing arranca transparente sobre el hero. En cualquier otra ruta
 * arranca sólida desde el primer píxel: un header transparente sobre un
 * listado no tendría hero sobre el cual ser transparente.
 *
 * En ambos modos, al hacer scroll se compacta y opaca.
 *
 * El estado del drawer llega por props porque `PublicLayout` es quien tiene
 * que marcar el resto de la página como inerte mientras está abierto.
 */
interface HeaderProps {
  drawerAbierto: boolean
  onAbrirDrawer: () => void
  onCerrarDrawer: () => void
}

const UMBRAL_SCROLL = 40

export function Header({ drawerAbierto, onAbrirDrawer, onCerrarDrawer }: HeaderProps) {
  const location = useLocation()
  const [scrolleado, setScrolleado] = useState(false)

  const esLanding = location.pathname === '/'

  useEffect(() => {
    function alHacerScroll() {
      setScrolleado(window.scrollY > UMBRAL_SCROLL)
    }

    // Se evalúa también al montar: al llegar a una ruta con el scroll ya
    // desplazado, el evento no se dispara solo.
    alHacerScroll()
    window.addEventListener('scroll', alHacerScroll, { passive: true })
    return () => window.removeEventListener('scroll', alHacerScroll)
  }, [])

  // Cierra el drawer al cambiar de ruta.
  useEffect(() => {
    onCerrarDrawer()
  }, [location.pathname, onCerrarDrawer])

  const solido = !esLanding || scrolleado

  // El color de los enlaces depende del modo; el resto de su estilo es fijo.
  const claseEnlace = [
    'text-[13px] font-medium tracking-[1.5px] uppercase transition-colors',
    solido ? 'text-text-primary hover:text-brand-600' : 'text-white hover:text-brand-100',
  ].join(' ')

  return (
    <>
      <header
        className={[
          'fixed top-0 right-0 left-0 z-40',
          'transition-[background-color,padding,box-shadow] duration-200',
          solido ? 'bg-surface shadow-header' : 'bg-transparent',
          scrolleado ? 'py-3' : 'py-5',
        ].join(' ')}
      >
        <Container width="wide">
          <div className="flex items-center justify-between gap-6">
            {/* El slot del logo va vacío por ahora, así que el nombre accesible
                del enlace lo tiene que aportar el aria-label. */}
            <Link to="/" aria-label="Urbanos & Rurales — Ir al inicio">
              <Logo variant={solido ? 'dark' : 'light'} />
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <NavLinks claseEnlace={claseEnlace} />
            </nav>

            {/* Enlaces con apariencia de botón, no botones dentro de enlaces. */}
            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/inmuebles?operacion=arriendo"
                className={clasesBoton({
                  variant: solido ? 'secondary' : 'outline-light',
                  size: 'sm',
                })}
              >
                Buscar inmueble
              </Link>
              <AnchorLink
                anchor="consignar"
                className={clasesBoton({ variant: 'primary', size: 'sm' })}
              >
                Consignar
              </AnchorLink>
            </div>

            <button
              type="button"
              onClick={onAbrirDrawer}
              aria-label="Abrir menú"
              aria-expanded={drawerAbierto}
              className={['p-2 md:hidden', solido ? 'text-text-primary' : 'text-white'].join(' ')}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </Container>
      </header>

      <MobileDrawer abierto={drawerAbierto} onCerrar={onCerrarDrawer} />
    </>
  )
}
