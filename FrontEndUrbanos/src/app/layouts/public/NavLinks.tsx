import { Link } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { navItems } from '@/app/layouts/public/navItems'

/**
 * Renderiza los items del menú, eligiendo entre enlace de ruta y enlace de
 * ancla según cada item.
 *
 * No decide su propia apariencia: el llamador pasa las clases, porque el
 * header las cambia según el modo de scroll y el drawer las tiene fijas.
 * Devuelve un fragmento, así que el llamador también controla el contenedor
 * y su disposición.
 */
interface NavLinksProps {
  claseEnlace: string
  /** Permite al drawer móvil cerrarse al navegar. */
  onNavigate?: () => void
}

export function NavLinks({ claseEnlace, onNavigate }: NavLinksProps) {
  return (
    <>
      {navItems.map((item) =>
        item.anchor ? (
          <AnchorLink
            key={item.label}
            anchor={item.anchor}
            onNavigate={onNavigate}
            className={claseEnlace}
          >
            {item.label}
          </AnchorLink>
        ) : (
          <Link key={item.label} to={item.to} onClick={onNavigate} className={claseEnlace}>
            {item.label}
          </Link>
        ),
      )}
    </>
  )
}
