import type { MouseEvent, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Enlace a una sección de la landing que funciona desde cualquier ruta.
 *
 * Estando en `/` hace scroll directo. Desde otra ruta no puede: la sección no
 * está montada. Navega entonces a `/` pasando el destino en el `state` del
 * router, y la landing lo consume al montar para hacer el scroll.
 *
 * Contrato para la landing (sub-proyecto 3): al montar debe leer
 * `useLocation().state?.scrollTo` y, si trae un id, hacer scroll a él.
 *
 * Mientras esas secciones no existan, el scroll no encuentra destino y no pasa
 * nada. Degrada sin error.
 */
interface AnchorLinkProps {
  anchor: string
  className?: string
  /** Permite al drawer móvil cerrarse al navegar. */
  onNavigate?: () => void
  children: ReactNode
}

export function AnchorLink({ anchor, className = '', onNavigate, children }: AnchorLinkProps) {
  const location = useLocation()
  const navigate = useNavigate()

  function manejarClic(evento: MouseEvent<HTMLAnchorElement>) {
    // Misma guarda que usa el Link de react-router-dom: clic derecho, central,
    // o con modificador (nueva pestaña/ventana) siguen el comportamiento nativo.
    const esClicModificado =
      evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey
    if (esClicModificado) return

    evento.preventDefault()
    onNavigate?.()

    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    navigate('/', { state: { scrollTo: anchor } })
  }

  // El href real se conserva para que el enlace sea copiable y abrible en una
  // pestaña nueva; el onClick solo intercepta el clic normal.
  return (
    <a href={`/#${anchor}`} onClick={manejarClic} className={className}>
      {children}
    </a>
  )
}
