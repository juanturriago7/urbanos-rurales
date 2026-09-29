import { useEffect, useRef, useState } from 'react'
import { Container } from '@/shared/components/ui/Container'

/**
 * Carrusel de clientes, compartido por la home y Quiénes somos.
 *
 * Cada tarjeta lleva logo Y nombre: el logo solo no basta para reconocer a
 * varias de estas entidades, y además el nombre cubre el caso de que falte el
 * archivo del logo.
 */
interface Cliente {
  nombre: string
  /** Ruta del logo. Sin logo, la tarjeta muestra el nombre como wordmark. */
  logo?: string
}

/**
 * Solo llevan `logo` las entidades cuyo archivo se verificó que contiene su
 * logo de verdad. Los archivos de `public/clientes/` estaban mal nombrados:
 * `invias.png` era el logo de MinSalud, `findeter.png` el de la SAE e
 * `ideam.png` el de Cundinamarca (ya renombrados), y los de EPM, ISA,
 * Alcaldía de Bogotá y Gobernación son fotos de stock, no logos. Con las
 * tarjetas en escala de grises y sin nombre el error no se veía; al poner el
 * nombre al lado quedaba un logo de MinSalud rotulado "INVÍAS".
 *
 * TODO(cliente): pedir los logos que faltan y añadirlos aquí.
 */
const CLIENTES: Cliente[] = [
  { nombre: 'Ministerio de Salud y Protección Social', logo: '/clientes/minsalud.png' },
  { nombre: 'Agencia Nacional de Infraestructura', logo: '/clientes/ani.png' },
  { nombre: 'Sociedad de Activos Especiales', logo: '/clientes/sae.png' },
  { nombre: 'Gobernación de Cundinamarca', logo: '/clientes/cundinamarca.png' },
  { nombre: 'Grupo Energía Bogotá', logo: '/clientes/geb.png' },
  { nombre: 'Compensar', logo: '/clientes/compensar.png' },
  { nombre: 'INVÍAS' },
  { nombre: 'FINDETER' },
  { nombre: 'IDEAM' },
  { nombre: 'EPM' },
  { nombre: 'ISA' },
  { nombre: 'Alcaldía de Bogotá' },
  { nombre: 'Ministerio de Vivienda' },
  { nombre: 'Fondo Nacional del Ahorro' },
]

interface ClientesCarruselProps {
  eyebrow?: string
  titulo?: string
  subtitulo?: string
}

export function ClientesCarrusel({
  eyebrow = 'Nuestros clientes',
  titulo = 'Empresas que confían en nosotros',
  subtitulo = 'Trabajamos con entidades del sector público y privado a nivel nacional, entregando soluciones de consultoría y gestión predial con los más altos estándares de calidad.',
}: ClientesCarruselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [logosFallidos, setLogosFallidos] = useState<string[]>([])
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)

  /* La animación es requestAnimationFrame, así que la media query de
     index.css no la detiene: hay que consultarla a mano. */
  const [sinMovimiento, setSinMovimiento] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const alCambiar = () => setSinMovimiento(mq.matches)
    mq.addEventListener('change', alCambiar)
    return () => mq.removeEventListener('change', alCambiar)
  }, [])

  // Duplicamos los items para el efecto infinito; sin animación no hace falta.
  const items = sinMovimiento ? CLIENTES : [...CLIENTES, ...CLIENTES]

  useEffect(() => {
    const track = trackRef.current
    if (!track || sinMovimiento) return

    const speed = 0.5 // px por frame

    const animate = () => {
      if (!isPaused) {
        const totalWidth = track.scrollWidth / 2
        posRef.current += speed
        if (posRef.current >= totalWidth) {
          posRef.current = 0
        }
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPaused, sinMovimiento])

  return (
    <section className="bg-[#eff4f8] py-16 sm:py-24">
      <Container>
        {/* Encabezado */}
        <div className="mb-10 text-center sm:mb-12">
          <span className="inline-block rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold tracking-[1.32px] text-[#004b98] uppercase">
              {eyebrow}
            </span>
          </span>
          <h2 className="titulo-seccion mt-4 text-[#001124]">{titulo}</h2>
          <p className="texto-lead mx-auto mt-3 max-w-[600px] text-[#7a8187]">{subtitulo}</p>
        </div>

        {/* Carrusel */}
        <div
          className={sinMovimiento ? 'overflow-x-auto' : 'overflow-hidden'}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          aria-label="Carrusel de clientes"
        >
          <div
            ref={trackRef}
            className="flex items-stretch gap-5 will-change-transform sm:gap-8"
          >
            {items.map((cliente, idx) => (
              <div
                key={idx}
                className="flex min-h-[104px] min-w-[150px] shrink-0 flex-col items-center justify-center gap-2 rounded-[16px] border border-[#d8dfe4] bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md sm:min-w-[185px] sm:px-6"
              >
                {cliente.logo && !logosFallidos.includes(cliente.nombre) ? (
                  <>
                    <img
                      src={cliente.logo}
                      alt=""
                      className="h-10 w-auto max-w-[130px] object-contain grayscale transition-all hover:grayscale-0 sm:h-12"
                      onError={() =>
                        setLogosFallidos((prev) =>
                          prev.includes(cliente.nombre) ? prev : [...prev, cliente.nombre],
                        )
                      }
                    />
                    <span className="text-center text-[11px] leading-tight font-semibold text-[#41596a] sm:text-[12px]">
                      {cliente.nombre}
                    </span>
                  </>
                ) : (
                  /* Sin logo la tarjeta se compone como wordmark, para que no
                     parezca una imagen rota ni descuadre la fila. */
                  <span className="text-center text-[14px] leading-tight font-bold text-[#004b98] text-balance">
                    {cliente.nombre}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
