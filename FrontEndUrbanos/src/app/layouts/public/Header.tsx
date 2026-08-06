import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { MobileDrawer } from '@/app/layouts/public/MobileDrawer'
import { NavLinks } from '@/app/layouts/public/NavLinks'
import { Container } from '@/shared/components/ui/Container'
import { Logo } from '@/shared/components/ui/Logo'

/**
 * Header premium — paleta crema/carbón/bronce.
 *
 * · En landing: arranca completamente transparente (flota sobre el hero).
 *   Al scrollear > 40px: transición a panel crema #faf8f5 con sombra sutil.
 * · En otras rutas: sólido desde el primer píxel.
 * · Links: hover con underline bronce deslizante.
 * · CTA "Consignar": fondo carbón, sin colores llamativos.
 */
interface HeaderProps {
  drawerAbierto: boolean
  onAbrirDrawer: () => void
  onCerrarDrawer: () => void
}

const UMBRAL_SCROLL = 50

export function Header({ drawerAbierto, onAbrirDrawer, onCerrarDrawer }: HeaderProps) {
  const location = useLocation()
  const [scrolleado, setScrolleado] = useState(false)

  const esLanding = location.pathname === '/'

  useEffect(() => {
    const alScroll = () => setScrolleado(window.scrollY > UMBRAL_SCROLL)
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  useEffect(() => { onCerrarDrawer() }, [location.pathname, onCerrarDrawer])

  // El hero es siempre claro/crema — nunca oscuro — así que los links
  // son SIEMPRE carbón. Solo cambia el fondo del header al scrollear.
  const solido = !esLanding || scrolleado

  const claseEnlace = [
    'relative pb-px text-[10.5px] font-semibold tracking-[2px] uppercase',
    'transition-colors duration-300',
    'text-[#1c1917]/50 hover:text-[#1c1917]',
    'after:absolute after:bottom-0 after:left-0 after:h-px after:w-0',
    'after:bg-[#8b6f4e] after:transition-[width] after:duration-300',
    'hover:after:w-full',
  ].join(' ')

  return (
    <>
      <header
        className={[
          'fixed top-0 right-0 left-0 z-40',
          'transition-all duration-400',
          solido
            ? 'bg-[#faf8f5]/97 backdrop-blur-md border-b border-[#1c1917]/07 shadow-[0_4px_24px_rgba(28,25,23,0.06)]'
            : 'bg-transparent',
          scrolleado ? 'py-3' : 'py-5',
        ].join(' ')}
      >
        <Container width="wide">
          <div className="flex items-center justify-between gap-8">

            <Link
              to="/"
              aria-label="Urbanos & Rurales — Inicio"
              className="shrink-0 transition-opacity duration-200 hover:opacity-70"
            >
              <Logo variant="dark" />
            </Link>

            {/* Nav desktop */}
            <nav className="hidden items-center gap-8 md:flex">
              <NavLinks claseEnlace={claseEnlace} />
            </nav>

            {/* Acciones desktop */}
            <div className="hidden items-center gap-5 md:flex">
              <Link
                to="/inmuebles?operacion=arriendo"
                className="text-[10.5px] font-semibold tracking-[2px] uppercase text-[#1c1917]/50 hover:text-[#8b6f4e] transition-colors duration-300"
              >
                Buscar inmueble
              </Link>

              <span className="h-3.5 w-px bg-[#1c1917]/12" aria-hidden="true" />

              <AnchorLink
                anchor="consignar"
                className={[
                  'inline-flex items-center px-5 py-2.5 text-[10.5px] font-semibold tracking-[2px] uppercase',
                  'rounded-sm bg-[#1c1917] text-[#faf8f5]',
                  'hover:bg-[#8b6f4e] shadow-[0_2px_12px_rgba(28,25,23,0.15)]',
                  'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
                ].join(' ')}
              >
                Consignar
              </AnchorLink>
            </div>

            {/* Hamburger mobile */}
            <button
              type="button"
              onClick={onAbrirDrawer}
              aria-label="Abrir menú"
              aria-expanded={drawerAbierto}
              className="p-2 text-[#1c1917]/50 hover:text-[#1c1917] transition-colors duration-200 md:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

          </div>
        </Container>
      </header>

      <MobileDrawer abierto={drawerAbierto} onCerrar={onCerrarDrawer} />
    </>
  )
}
