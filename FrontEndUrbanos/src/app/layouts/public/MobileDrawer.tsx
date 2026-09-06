import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { site } from '@/shared/config/site'

/**
 * Panel de navegación móvil.
 * Paleta: azul marino #001124 / cian #00b5c5 / azul #004b98 — igual que el header.
 * Comportamiento modal: atrapa foco, cierra con Escape, bloquea scroll del body.
 */
interface MobileDrawerProps {
  abierto: boolean
  onCerrar: () => void
}

const SELECTOR_ENFOCABLES = 'a[href], button:not([disabled]), input, select, textarea'

const NAV_ITEMS = [
  { label: 'Inicio',              to: '/' },
  { label: 'Quiénes somos',       to: '/quienes-somos' },
  { label: 'Líneas de servicio',  anchor: 'servicios' },
  { label: 'Inmuebles',           to: '/inmuebles' },
  { label: 'Contacto',            anchor: 'contacto' },
] as const

export function MobileDrawer({ abierto, onCerrar }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  /* Bloquea scroll del body */
  useEffect(() => {
    if (!abierto) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [abierto])

  /* Escape + trampa de foco */
  useEffect(() => {
    if (!abierto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onCerrar(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES))
      if (!nodes.length) return
      if (e.shiftKey && document.activeElement === nodes[0]) {
        e.preventDefault(); nodes[nodes.length - 1].focus()
      } else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) {
        e.preventDefault(); nodes[0].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, onCerrar])

  /* Mueve foco al panel al abrir */
  useEffect(() => {
    if (!abierto) return
    const prev = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>(SELECTOR_ENFOCABLES)?.focus()
    return () => { prev?.focus() }
  }, [abierto])

  /* Cierra al cambiar de ruta */
  useEffect(() => { onCerrar() }, [location.pathname, onCerrar])

  /**
   * Si ya estamos en home, hace scroll directo. Si no, navega a home con el
   * hash del ancla — HomePage detecta location.hash al montar y hace el scroll.
   */
  function handleAnchor(anchor: string) {
    onCerrar()
    if (location.pathname === '/') {
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 150)
    } else {
      navigate(`/#${anchor}`)
    }
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">

      {/* Overlay oscuro */}
      <div
        className="absolute inset-0 bg-[#001124]/60 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="animate-drawer-in absolute top-0 right-0 h-full w-[82%] max-w-sm flex flex-col bg-white shadow-[−8px_0_32px_rgba(0,17,36,0.18)]"
      >
        {/* Franja cian superior */}
        <div className="h-1 w-full bg-[#00b5c5] shrink-0" />

        {/* Cabecera del panel */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8edf2] shrink-0">
          {/* Logo compacto */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#004b98] rounded-lg w-9 h-9 flex items-center justify-center shrink-0">
              <span className="font-extrabold text-white text-[12px] tracking-tight">U&amp;R</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-[#001124] text-[13px] tracking-tight">Urbanos &amp; Rurales</span>
              <span className="text-[#7a8187] text-[9px] tracking-[0.7px] uppercase mt-0.5">Gestión Inmobiliaria</span>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7a8187] hover:text-[#001124] hover:bg-[#eff4f8] transition-colors duration-200"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 3l12 12M15 3L3 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex flex-col px-3 py-4 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = 'to' in item && location.pathname === item.to

            if ('anchor' in item) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleAnchor(item.anchor)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium text-[#0d1c27] hover:bg-[#eff4f8] hover:text-[#004b98] transition-colors duration-200 text-left w-full"
                >
                  {item.label}
                </button>
              )
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={onCerrar}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-[rgba(0,75,152,0.08)] text-[#004b98] font-semibold'
                    : 'text-[#0d1c27] hover:bg-[#eff4f8] hover:text-[#004b98]',
                ].join(' ')}
              >
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#004b98]" aria-hidden="true" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Separador */}
        <div className="mx-6 h-px bg-[#e8edf2] shrink-0" />

        {/* CTAs */}
        <div className="flex flex-col gap-3 px-6 py-5 shrink-0">
          <Link
            to="/inmuebles"
            onClick={onCerrar}
            className="flex items-center justify-center gap-2 w-full border border-[#004b98] text-[#004b98] font-semibold text-[13px] py-3 rounded-[10px] hover:bg-[rgba(0,75,152,0.05)] transition-colors duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" strokeLinecap="round" />
            </svg>
            Buscar inmueble
          </Link>

          <Link
            to="/#contacto"
            onClick={onCerrar}
            className="flex items-center justify-center w-full bg-[#004b98] text-white font-semibold text-[13px] py-3 rounded-[10px] hover:bg-[#003b7a] transition-colors duration-200 shadow-[0_4px_12px_rgba(0,75,152,0.25)]"
          >
            Contáctanos
          </Link>
        </div>

        {/* Datos de contacto rápido */}
        <div className="bg-[#f8fafd] border-t border-[#e8edf2] px-6 py-4 shrink-0">
          <a
            href={`tel:${site.contacto.telefono.replace(/[^\d+]/g, '')}`}
            className="flex items-center gap-2 text-[12px] text-[#7a8187] hover:text-[#004b98] transition-colors mb-1.5"
          >
            <svg className="w-3.5 h-3.5 shrink-0 text-[#00b5c5]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M2 3.5a1.5 1.5 0 011.5-1.5h.75a1 1 0 01.95.68l.75 2.25a1 1 0 01-.23 1.05l-.87.91a8.25 8.25 0 003.08 3.08l.91-.87a1 1 0 011.05-.23l2.25.75a1 1 0 01.68.95V12.5A1.5 1.5 0 0112.5 14C6.7 14 2 9.3 2 3.5z" strokeLinejoin="round"/>
            </svg>
            {site.contacto.telefono}
          </a>
          <a
            href={`mailto:${site.contacto.email}`}
            className="flex items-center gap-2 text-[12px] text-[#7a8187] hover:text-[#004b98] transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0 text-[#00b5c5]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="1" y="3" width="14" height="10" rx="1.5" /><path d="M1 5l7 5 7-5" strokeLinejoin="round"/>
            </svg>
            {site.contacto.email}
          </a>
        </div>

      </div>
    </div>
  )
}
