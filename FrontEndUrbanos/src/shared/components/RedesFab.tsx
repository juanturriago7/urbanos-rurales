import { Share2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { InstagramIcon, TikTokIcon } from '@/shared/components/icons/SocialIcons'
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon'
import { site } from '@/shared/config/site'
import { esRutaFichaInmueble } from '@/shared/lib/rutas'

/**
 * Pila flotante de contacto y redes: Instagram, TikTok y WhatsApp.
 *
 * No aparece de inmediato: espera dos segundos o el primer scroll, lo que
 * ocurra antes, para no competir con el hero en el primer vistazo.
 *
 * En móvil la pila completa medía ~170px de alto y tapaba texto, el envío del
 * formulario y la paginación. Por eso, por debajo de `sm`, Instagram y TikTok
 * quedan plegadas tras un botón de redes y solo WhatsApp está siempre a la
 * vista. Cerrada, la pila mide ~104px.
 */
const RETARDO_MS = 2000

const MENSAJE = 'Hola, vengo del sitio web y quiero información sobre un inmueble.'

const ID_LISTA = 'redes-fab-lista'

interface Enlace {
  etiqueta: string
  aria: string
  href: string
  Icon: ComponentType<{ className?: string }>
  fondo: string
}

const REDES: Enlace[] = [
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
]

/**
 * WhatsApp va último para quedar pegado al borde inferior: es el CTA principal
 * y esa es la esquina que el pulgar alcanza sin estirarse en móvil.
 */
const WHATSAPP: Enlace = {
  etiqueta: 'Respondemos en segundos',
  aria: 'Escribir por WhatsApp',
  href: `https://wa.me/${site.contacto.whatsapp}?text=${encodeURIComponent(MENSAJE)}`,
  Icon: WhatsAppIcon,
  fondo: 'bg-[#25D366]',
}

/** En móvil las redes son más chicas que WhatsApp para no restarle protagonismo. */
const TAMANOS = {
  red: { circulo: 'h-10 w-10 sm:h-14 sm:w-14', icono: 'h-5 w-5 sm:h-7 sm:w-7' },
  principal: { circulo: 'h-12 w-12 sm:h-14 sm:w-14', icono: 'h-6 w-6 sm:h-7 sm:w-7' },
}

export function RedesFab() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  // En la ficha, por debajo de `lg`, la barra fija ya lleva WhatsApp y el FAB
  // se montaría encima de ella.
  const enFicha = esRutaFichaInmueble(location.pathname)

  // Solo tiene efecto por debajo de `sm`: desde ahí las redes siempre se ven.
  const [abiertas, setAbiertas] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)

  // Al navegar se pliegan. Se ajusta durante el render (patrón de React para
  // "ajustar estado cuando cambia una prop") en vez de con un efecto.
  const [ubicacionPrevia, setUbicacionPrevia] = useState(location.key)
  if (location.key !== ubicacionPrevia) {
    setUbicacionPrevia(location.key)
    setAbiertas(false)
  }

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

  // Abiertas, se pliegan al tocar fuera o con Escape (devolviendo el foco al
  // botón solo si ya estaba dentro del FAB, para no robárselo a quien ya
  // tabuló hacia otro lado de la página).
  useEffect(() => {
    if (!abiertas) return

    function alTocarFuera(e: PointerEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbiertas(false)
    }

    function alPulsarTecla(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setAbiertas(false)
      if (contenedorRef.current?.contains(document.activeElement)) {
        botonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', alTocarFuera)
    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      document.removeEventListener('pointerdown', alTocarFuera)
      document.removeEventListener('keydown', alPulsarTecla)
    }
  }, [abiertas])

  return (
    <div
      ref={contenedorRef}
      // Mientras es invisible tiene que salir del orden de tabulación y del
      // árbol de accesibilidad. `opacity-0` no lo saca —no es `display` ni
      // `visibility`— y `pointer-events-none` solo gobierna ratón y táctil, no
      // el teclado. Sin esto, quien tabula durante los dos primeros segundos
      // aterriza en enlaces completamente transparentes cuyo anillo de foco
      // también es invisible, que es justo lo que prohíbe WCAG 2.4.7.
      // `inert` cubre foco, árbol de accesibilidad y toques de una sola vez
      // (también para los hijos `pointer-events-auto`); React 19 lo soporta
      // de forma nativa.
      inert={!visible}
      className={[
        // z-30 y no z-50: el drawer movil es z-50 y va antes en el DOM, asi que
        // con ambos al mismo nivel el FAB se pintaba encima del panel modal.
        // La jerarquia queda contenido < FAB < header (z-40) < modal (z-50).
        //
        // `pointer-events-none` siempre: en móvil, las redes plegadas dejan un
        // hueco encima del botón que no debe bloquear toques sobre el
        // contenido. Cada botón reactiva sus eventos con `pointer-events-auto`.
        'pointer-events-none fixed right-6 bottom-6 z-30 flex-col items-end gap-3',
        enFicha ? 'hidden lg:flex' : 'flex',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      {/* El toggle va antes que la lista en el DOM: así quien navega hacia
      adelante con teclado o lector de pantalla cae en Instagram al salir del
      toggle, no en WhatsApp. `max-sm:-order-1` conserva en pantalla el orden
      visual de siempre en móvil (redes, toggle, WhatsApp); desde `sm` el
      toggle está oculto y el orden visual ya es Instagram, TikTok, WhatsApp
      sin necesidad de `order`. */}
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbiertas((a) => !a)}
        aria-expanded={abiertas}
        aria-controls={ID_LISTA}
        aria-label={abiertas ? 'Cerrar redes sociales' : 'Abrir redes sociales'}
        className="shadow-dropdown pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#004b98] text-white sm:hidden"
      >
        {abiertas ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Share2 className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      <div
        id={ID_LISTA}
        // Plegadas en móvil: `invisible` (visibility: hidden) las saca del tab,
        // del árbol de accesibilidad y de los toques. A diferencia de `inert`,
        // se limita a móvil con una variante de Tailwind.
        className={[
          'flex flex-col items-end gap-3 transition-[opacity,transform,visibility] duration-200',
          'max-sm:-order-1',
          abiertas ? '' : 'max-sm:invisible max-sm:translate-y-2 max-sm:opacity-0',
        ].join(' ')}
      >
        {REDES.map((red) => (
          <EnlaceFab
            key={red.etiqueta}
            enlace={red}
            tamano="red"
            onClick={() => setAbiertas(false)}
          />
        ))}
      </div>

      <EnlaceFab enlace={WHATSAPP} tamano="principal" onClick={() => setAbiertas(false)} />
    </div>
  )
}

interface EnlaceFabProps {
  enlace: Enlace
  tamano: keyof typeof TAMANOS
  onClick?: () => void
}

function EnlaceFab({
  enlace: { etiqueta, aria, href, Icon, fondo },
  tamano,
  onClick,
}: EnlaceFabProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      onClick={onClick}
      // `items-end` en el contenedor ancla el borde derecho, así que la
      // etiqueta puede aparecer y desaparecer en hover sin mover el círculo.
      className="group pointer-events-auto flex items-center gap-3"
    >
      <span className="rounded-control bg-surface text-text-secondary shadow-dropdown hidden px-3 py-2 text-xs whitespace-nowrap group-hover:block">
        {etiqueta}
      </span>

      <span
        className={[
          'flex items-center justify-center rounded-full',
          'shadow-dropdown transition-transform duration-200 group-hover:scale-110',
          TAMANOS[tamano].circulo,
          fondo,
        ].join(' ')}
      >
        <Icon className={`${TAMANOS[tamano].icono} text-white`} />
      </span>
    </a>
  )
}
