import { useEffect, useState } from 'react'
import { InstagramIcon, TikTokIcon } from '@/shared/components/icons/SocialIcons'
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon'
import { site } from '@/shared/config/site'

/**
 * Pila flotante de contacto y redes: Instagram, TikTok y WhatsApp.
 *
 * No aparece de inmediato: espera dos segundos o el primer scroll, lo que
 * ocurra antes, para no competir con el hero en el primer vistazo.
 */
const RETARDO_MS = 2000

const MENSAJE = 'Hola, vengo del sitio web y quiero información sobre un inmueble.'

/**
 * El orden importa: se pintan de arriba hacia abajo, así que WhatsApp va último
 * para quedar pegado al borde inferior. Es el CTA principal y esa es la esquina
 * que el pulgar alcanza sin estirarse en móvil; las redes quedan por encima,
 * visibles pero sin robarle el punto cómodo.
 */
const BOTONES = [
  {
    etiqueta: 'Síguenos en Instagram',
    aria: 'Abrir el Instagram de Urbanos & Rurales',
    href: site.redes.instagram,
    Icon: InstagramIcon,
    // El degradado es la identidad de Instagram; en plano se leería como un
    // icono genérico al lado de los otros dos, que sí van con su color de marca.
    fondo: 'bg-[linear-gradient(45deg,#F58529_0%,#DD2A7B_45%,#8134AF_75%,#515BD4_100%)]',
  },
  {
    etiqueta: 'Síguenos en TikTok',
    aria: 'Abrir el TikTok de Urbanos & Rurales',
    href: site.redes.tiktok,
    Icon: TikTokIcon,
    fondo: 'bg-[#010101]',
  },
  {
    etiqueta: 'Respondemos en segundos',
    aria: 'Escribir por WhatsApp',
    href: `https://wa.me/${site.contacto.whatsapp}?text=${encodeURIComponent(MENSAJE)}`,
    Icon: WhatsAppIcon,
    fondo: 'bg-[#25D366]',
  },
]

export function RedesFab() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const temporizador = window.setTimeout(() => setVisible(true), RETARDO_MS)

    function alHacerScroll() {
      setVisible(true)
    }

    window.addEventListener('scroll', alHacerScroll, { passive: true, once: true })

    return () => {
      window.clearTimeout(temporizador)
      window.removeEventListener('scroll', alHacerScroll)
    }
  }, [])

  return (
    <div
      // Mientras es invisible tiene que salir del orden de tabulación y del
      // árbol de accesibilidad. `opacity-0` no lo saca —no es `display` ni
      // `visibility`— y `pointer-events-none` solo gobierna ratón y táctil, no
      // el teclado. Sin esto, quien tabula durante los dos primeros segundos
      // aterriza en enlaces completamente transparentes cuyo anillo de foco
      // también es invisible, que es justo lo que prohíbe WCAG 2.4.7.
      // `inert` cubre foco y árbol de accesibilidad de una sola vez para los
      // tres enlaces; React 19 lo soporta de forma nativa.
      inert={!visible}
      className={[
        // z-30 y no z-50: el drawer movil es z-50 y va antes en el DOM, asi que
        // con ambos al mismo nivel el FAB se pintaba encima del panel modal.
        // La jerarquia queda contenido < FAB < header (z-40) < modal (z-50).
        'fixed right-6 bottom-6 z-30 flex flex-col items-end gap-3',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      {BOTONES.map(({ etiqueta, aria, href, Icon, fondo }) => (
        <a
          key={etiqueta}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={aria}
          // `items-end` en el contenedor ancla el borde derecho, así que la
          // etiqueta puede aparecer y desaparecer en hover sin mover el círculo.
          className="group flex items-center gap-3"
        >
          <span className="rounded-control bg-surface text-text-secondary shadow-dropdown hidden px-3 py-2 text-xs whitespace-nowrap group-hover:block">
            {etiqueta}
          </span>

          <span
            className={[
              'flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14',
              'shadow-dropdown transition-transform duration-200 group-hover:scale-110',
              fondo,
            ].join(' ')}
          >
            <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          </span>
        </a>
      ))}
    </div>
  )
}
