import { Mail, MapPin, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MobileDrawer } from '@/app/layouts/public/MobileDrawer'
import { Container } from '@/shared/components/ui/Container'
import { site } from '@/shared/config/site'

interface HeaderProps {
  drawerAbierto: boolean
  onAbrirDrawer: () => void
  onCerrarDrawer: () => void
}

const NAV_ITEMS = [
  { label: 'Inicio',        to: '/' },
  { label: 'Quiénes somos', to: '/quienes-somos' },
  { label: 'Servicios',     anchor: 'servicios' },
  { label: 'Inmuebles',     to: '/inmuebles' },
  { label: 'Proyectos',     to: '/proyectos' },
  { label: 'Contacto',      anchor: 'contacto' },
] as const

export function Header({ drawerAbierto, onAbrirDrawer, onCerrarDrawer }: HeaderProps) {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { onCerrarDrawer() }, [location.pathname, onCerrarDrawer])

  function handleAnchorClick(anchor: string) {
    onCerrarDrawer()
    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex flex-col">
        {/* ── Top bar información de contacto ── */}
        <div className="bg-[#001124] hidden md:flex">
          <Container width="wide">
            <div className="flex items-center gap-8 py-[10px]">
              <div className="flex items-center gap-[6px] text-[#a1c5cc]">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                <span className="text-[#a1c5cc] text-[12px] tracking-[0.24px]">
                  Av Kr 15 #98-42 Of. M02, Edificio Office Point, Barrio Chicó, Bogotá
                </span>
              </div>
              <div className="flex items-center gap-[6px] text-[#a1c5cc]">
                <Phone className="w-3 h-3" aria-hidden="true" />
                <span className="text-[#a1c5cc] text-[12px] tracking-[0.24px]">
                  {site.contacto.telefono} &nbsp;·&nbsp; {site.contacto.whatsappVisible}
                </span>
              </div>
              <div className="flex items-center gap-[6px] text-[#a1c5cc]">
                <Mail className="w-3 h-3" aria-hidden="true" />
                <span className="text-[#a1c5cc] text-[12px] tracking-[0.24px]">
                  {site.contacto.email}
                </span>
              </div>
            </div>
          </Container>
        </div>

        {/* ── Navbar principal ── */}
        <div
          className={[
            'bg-[rgba(255,255,255,0.96)] backdrop-blur-[6px] border-b border-[#d8dfe4]',
            'transition-shadow duration-300',
            scrolled ? 'shadow-[0px_2px_24px_rgba(0,75,152,0.12)]' : '',
          ].join(' ')}
        >
          <Container width="wide">
            <div className="flex h-16 items-center justify-between gap-8">
              {/* Logo */}
              <Link to="/" aria-label="Urbanos & Rurales — Inicio" className="flex items-center gap-3 shrink-0">
                <div className="bg-[#004b98] rounded-[8px] w-11 h-11 flex items-center justify-center">
                  <span className="font-extrabold text-white text-[14px] tracking-[-0.5px]">U&amp;R</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-[#001124] text-[15px] tracking-[-0.3px]">Urbanos &amp; Rurales</span>
                  <span className="text-[#7a8187] text-[10px] tracking-[0.8px] uppercase mt-[2px]">Gestión Inmobiliaria · S.A.S</span>
                </div>
              </Link>

              {/* Nav desktop */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = 'to' in item && location.pathname === item.to
                  const base = 'px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors duration-200'
                  const active = 'bg-[rgba(0,75,152,0.08)] text-[#004b98]'
                  const normal = 'text-[#0d1c27] hover:bg-[rgba(0,75,152,0.05)] hover:text-[#004b98]'

                  if ('anchor' in item) {
                    return (
                      <button key={item.label} onClick={() => handleAnchorClick(item.anchor)}
                        className={`${base} ${normal} cursor-pointer`}>
                        {item.label}
                      </button>
                    )
                  }
                  return (
                    <Link key={item.label} to={item.to}
                      className={`${base} ${isActive ? active : normal}`}>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* CTA desktop */}
              <div className="hidden md:flex items-center gap-3 shrink-0">
                <Link to="/inmuebles"
                  className="text-[13px] font-semibold text-[#0d1c27] hover:text-[#004b98] transition-colors duration-200">
                  Buscar inmueble
                </Link>
                <Link to="/inmuebles"
                  className="bg-[#004b98] text-white text-[13px] font-semibold tracking-[0.13px] px-[22px] py-[10px] rounded-[8px] hover:bg-[#003b7a] transition-colors duration-200">
                  Contáctanos
                </Link>
              </div>

              {/* Hamburger mobile */}
              <button type="button" onClick={onAbrirDrawer} aria-label="Abrir menú"
                aria-expanded={drawerAbierto}
                className="p-2 text-[#001124]/50 hover:text-[#001124] transition-colors duration-200 md:hidden">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </Container>
        </div>
      </header>

      <MobileDrawer abierto={drawerAbierto} onCerrar={onCerrarDrawer} />
    </>
  )
}
