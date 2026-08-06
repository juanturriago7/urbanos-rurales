import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { NavLinks } from '@/app/layouts/public/NavLinks'

/**
 * Panel de navegación móvil. Se comporta como un diálogo modal: atrapa el foco,
 * cierra con Escape y bloquea el scroll de la página mientras está abierto.
 */
interface MobileDrawerProps {
  abierto: boolean
  onCerrar: () => void
}

const SELECTOR_ENFOCABLES = 'a[href], button:not([disabled]), input, select, textarea'

export function MobileDrawer({ abierto, onCerrar }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Bloquea el scroll del body mientras el panel está abierto, para que el
  // contenido de detrás no se desplace al arrastrar sobre el panel.
  useEffect(() => {
    if (!abierto) return

    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto])

  // Escape cierra; Tab queda atrapado dentro del panel.
  useEffect(() => {
    if (!abierto) return

    function manejarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        onCerrar()
        return
      }

      if (evento.key !== 'Tab' || !panelRef.current) return

      const enfocables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES),
      )
      if (enfocables.length === 0) return

      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [abierto, onCerrar])

  // Al abrir, mueve el foco al primer elemento del panel. Al cerrar, lo
  // devuelve a donde estaba —el botón hamburguesa—, como exige un diálogo
  // modal: sin esto el foco quedaría al principio del documento y quien navega
  // por teclado tendría que recorrerlo entero otra vez.
  useEffect(() => {
    if (!abierto) return

    const enfocadoPreviamente = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>(SELECTOR_ENFOCABLES)?.focus()

    return () => {
      enfocadoPreviamente?.focus()
    }
  }, [abierto])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay con blur suave */}
      <div
        className="absolute inset-0 bg-[#1c1917]/40 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="animate-drawer-in absolute top-0 right-0 flex h-full w-[82%] max-w-sm flex-col bg-[#faf8f5] px-8 py-7"
      >
        {/* Línea decorativa bronce en la parte superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-[#8b6f4e]/30" />

        {/* Cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="mb-10 self-end p-1 text-[#1c1917]/30 hover:text-[#1c1917] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {/* Links */}
        <nav className="flex flex-col gap-7">
          <NavLinks
            claseEnlace="text-[10.5px] font-semibold tracking-[2px] uppercase text-[#1c1917]/50 hover:text-[#1c1917] transition-colors duration-200"
            onNavigate={onCerrar}
          />
        </nav>

        {/* Divisor */}
        <div className="mt-auto mb-7 h-px bg-[#1c1917]/08" />

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            to="/inmuebles?operacion=arriendo"
            onClick={onCerrar}
            className={[
              'inline-flex items-center justify-center px-6 py-3 w-full rounded-sm',
              'text-[10.5px] font-semibold tracking-[2px] uppercase',
              'border border-[#1c1917]/20 text-[#1c1917]/70',
              'hover:border-[#8b6f4e] hover:text-[#8b6f4e] transition-colors duration-200',
            ].join(' ')}
          >
            Buscar inmueble
          </Link>
          <AnchorLink
            anchor="consignar"
            onNavigate={onCerrar}
            className={[
              'inline-flex items-center justify-center px-6 py-3 w-full rounded-sm',
              'text-[10.5px] font-semibold tracking-[2px] uppercase',
              'bg-[#1c1917] text-[#faf8f5]',
              'hover:bg-[#2d2926] transition-colors duration-200',
              'shadow-[0_2px_12px_rgba(28,25,23,0.15)]',
            ].join(' ')}
          >
            Consignar
          </AnchorLink>
        </div>
      </div>
    </div>
  )
}
