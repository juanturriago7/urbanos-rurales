import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { NavLinks } from '@/app/layouts/public/NavLinks'
import { clasesBoton } from '@/shared/components/ui/Button'

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
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="bg-surface shadow-dropdown animate-drawer-in absolute top-0 right-0 flex h-full w-[80%] max-w-sm flex-col p-6"
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="text-text-primary mb-8 self-end p-2"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <nav className="flex flex-col gap-6">
          <NavLinks
            claseEnlace="text-sm font-medium tracking-[1.5px] text-text-primary uppercase"
            onNavigate={onCerrar}
          />
        </nav>

        {/* Enlaces con apariencia de botón, no botones dentro de enlaces: cada
            CTA es un solo elemento y una sola parada de tabulación. */}
        <div className="mt-auto flex flex-col gap-3">
          <Link
            to="/inmuebles?operacion=arriendo"
            onClick={onCerrar}
            className={clasesBoton({ variant: 'secondary', size: 'lg', className: 'w-full' })}
          >
            Buscar inmueble
          </Link>
          <AnchorLink
            anchor="consignar"
            onNavigate={onCerrar}
            className={clasesBoton({ variant: 'primary', size: 'lg', className: 'w-full' })}
          >
            Consignar
          </AnchorLink>
        </div>
      </div>
    </div>
  )
}
