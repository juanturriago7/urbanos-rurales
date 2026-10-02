import { Container } from '@/shared/components/ui/Container'
import { ArrowRight, BedDouble, House, MapPin, Ruler } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { InmueblePublicoListItemDto } from '@/features/public/properties/api/inmueblesPublicApi'
import { usePublicaciones } from '@/features/public/properties/hooks/usePublicaciones'
import { BadgeDestacado } from '@/features/public/properties/components/BadgeDestacado'
import { indiceMasCercanoAlCentro } from '@/features/public/properties/lib/carrusel'

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(precioVenta: number | null, precioArriendo: number | null): {
  texto: string
  operacion: 'Venta' | 'Arriendo' | null
} {
  if (precioVenta !== null) {
    return { texto: formatoPesos.format(precioVenta), operacion: 'Venta' }
  }
  if (precioArriendo !== null) {
    return { texto: `${formatoPesos.format(precioArriendo)}/mes`, operacion: 'Arriendo' }
  }
  return { texto: '—', operacion: null }
}

/** El home es una muestra; el portafolio completo vive en /inmuebles. */
const CANTIDAD = 3

/**
 * Carrusel deslizable con scroll-snap por debajo de `lg`, grilla de 3 desde
 * `lg`. Los márgenes negativos lo llevan hasta el borde de la pantalla para que
 * la tarjeta siguiente asome; `py-2` evita que el desplazamiento del hover se
 * recorte (un `overflow-x-auto` también recorta en vertical) y `relative` hace
 * del carril el `offsetParent` de las tarjetas, para medirlas en las mismas
 * coordenadas que `scrollLeft`.
 */
const CARRIL = [
  'relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-2',
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6',
  'lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0',
].join(' ')

/** Ancho de cada tarjeta dentro del carril: una y algo en móvil, dos en tablet. */
const CELDA = 'shrink-0 basis-[85%] snap-center sm:basis-[48%] lg:basis-auto'

/**
 * Sección de publicaciones en el home — spec 05.
 *
 * Muestra solo 3 inmuebles y remite al portafolio completo con un botón grande
 * al final. Comparte paleta y tipografía con el resto del home.
 *
 * Si no hay publicaciones o la API falla, la sección no se renderiza (mejor
 * ausente que un hueco o un error visible debajo del hero).
 */
export function PublicacionesDestacadas() {
  const { data, isLoading, isError } = usePublicaciones({ pageSize: CANTIDAD })
  const carrilRef = useRef<HTMLDivElement>(null)
  const [activo, setActivo] = useState(0)

  if (isError) return null
  if (!isLoading && (!data || data.items.length === 0)) return null

  const items = data?.items ?? []

  function alDeslizar() {
    const carril = carrilRef.current
    if (!carril) return
    const centros = Array.from(carril.children, (hijo) => {
      const tarjeta = hijo as HTMLElement
      return tarjeta.offsetLeft + tarjeta.offsetWidth / 2
    })
    setActivo(indiceMasCercanoAlCentro(centros, carril.scrollLeft + carril.clientWidth / 2))
  }

  function irATarjeta(indice: number) {
    const carril = carrilRef.current
    const tarjeta = carril?.children[indice] as HTMLElement | undefined
    if (!carril || !tarjeta) return
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    carril.scrollTo({
      left: tarjeta.offsetLeft - (carril.clientWidth - tarjeta.offsetWidth) / 2,
      behavior: sinMovimiento ? 'auto' : 'smooth',
    })
  }

  return (
    <section className="bg-[#eff4f8] py-16 sm:py-24">
      <Container>
        {/* Encabezado: centrado en móvil, a la izquierda desde sm */}
        <div className="reveal mb-10 flex flex-col items-center gap-3 text-center sm:mb-12 sm:items-start sm:text-left">
          <span className="rounded-full bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px]">
            <span className="text-[11px] font-semibold tracking-[1.32px] text-[#004b98] uppercase">
              Publicaciones
            </span>
          </span>
          <h2 className="titulo-seccion text-[#001124]">Inmuebles disponibles</h2>
          <p className="texto-lead max-w-[560px] text-[#7a8187]">
            Nuestras propiedades destacadas y las más recientes del portafolio.
          </p>
        </div>

        {/* Skeletons de carga */}
        {isLoading && (
          <div className={CARRIL}>
            {Array.from({ length: CANTIDAD }).map((_, i) => (
              <div
                key={i}
                className={`${CELDA} animate-pulse overflow-hidden rounded-[18px] border border-[#d8dfe4] bg-white`}
              >
                <div className="bg-[#e0e5e9]" style={{ aspectRatio: '382/286.5' }} />
                <div className="flex flex-col gap-3 p-5">
                  <div className="h-5 w-1/3 rounded bg-[#e0e5e9]" />
                  <div className="h-4 w-3/4 rounded bg-[#e0e5e9]" />
                  <div className="h-3 w-1/2 rounded bg-[#e0e5e9]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            <div
              ref={carrilRef}
              onScroll={alDeslizar}
              className={CARRIL}
              role="region"
              aria-label="Inmuebles disponibles"
            >
              {items.map((inmueble) => (
                <TarjetaPublicacion key={inmueble.id} inmueble={inmueble} className={CELDA} />
              ))}
            </div>

            {/* Puntos: solo donde hay carrusel y si hay más de una tarjeta */}
            {items.length > 1 && (
              <div className="mt-4 flex justify-center gap-2 lg:hidden">
                {items.map((inmueble, i) => (
                  <button
                    key={inmueble.id}
                    type="button"
                    onClick={() => irATarjeta(i)}
                    aria-label={`Ver inmueble ${i + 1} de ${items.length}`}
                    aria-current={i === activo ? 'true' : undefined}
                    className={[
                      'h-2.5 rounded-full transition-all duration-300',
                      i === activo ? 'w-6 bg-[#004b98]' : 'w-2.5 bg-[#c3ccd3]',
                    ].join(' ')}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            to="/inmuebles"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#004b98] px-10 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#003b7a] sm:w-auto"
          >
            Ver más inmuebles
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  )
}

interface TarjetaPublicacionProps {
  inmueble: InmueblePublicoListItemDto
  className?: string
}

/** Tarjeta de inmueble, mismo lenguaje que /inmuebles para consistencia. */
function TarjetaPublicacion({ inmueble, className = '' }: TarjetaPublicacionProps) {
  const { texto: precio, operacion } = formatPrice(inmueble.precioVenta, inmueble.precioArriendo)
  const badgeBg = operacion === 'Arriendo' ? 'bg-[#df500c]' : 'bg-[#00b5c5]'
  const badgeTxt = operacion === 'Arriendo' ? 'text-white' : 'text-[#001124]'

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[18px] border border-[#d8dfe4] bg-white p-px transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,17,36,0.10)] ${className}`}
    >
      <Link to={`/inmuebles/${inmueble.slug}`} className="contents">
        {/* Imagen */}
        <div
          className="relative shrink-0 overflow-hidden rounded-t-[17px]"
          style={{ aspectRatio: '382/286.5' }}
        >
          {inmueble.imagenPortada ? (
            <img
              src={inmueble.imagenPortada}
              alt={inmueble.titulo}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)',
              }}
            >
              <span className="px-4 text-center text-[11px] text-[rgba(255,255,255,0.4)]">
                Sin fotografía disponible
              </span>
            </div>
          )}
          {operacion && (
            <span
              className={`absolute top-3.5 left-3.5 ${badgeBg} ${badgeTxt} rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.33px]`}
            >
              {operacion}
            </span>
          )}
          {inmueble.destacado && <BadgeDestacado />}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 p-5">
          <p className="text-[20px] leading-none font-extrabold tracking-[-0.5px] text-[#004b98]">
            {precio}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug font-bold text-[#001124]">
            {inmueble.titulo}
          </p>
          <div className="flex items-center gap-[5px] pb-2.5 text-[#7a8187]">
            <MapPin className="h-[13px] w-[13px] shrink-0" aria-hidden="true" />
            <span className="truncate text-[13px] text-[#7a8187]">{inmueble.ubicacion}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-[14px] gap-y-1 border-t border-[#e0e5e9] pt-[15px]">
            {inmueble.areaConstruidaM2 && (
              <span className="flex items-center gap-[5px] text-[#7a8187]">
                <Ruler className="h-[13px] w-[13px]" aria-hidden="true" />
                <span className="text-[12px] font-medium text-[#7a8187]">
                  {inmueble.areaConstruidaM2} m²
                </span>
              </span>
            )}
            {inmueble.habitaciones > 0 && (
              <span className="flex items-center gap-[5px] text-[#7a8187]">
                <BedDouble className="h-[13px] w-[13px]" aria-hidden="true" />
                <span className="text-[12px] font-medium text-[#7a8187]">
                  {inmueble.habitaciones} hab
                </span>
              </span>
            )}
            <span className="flex items-center gap-[5px] text-[#7a8187]">
              <House className="h-[13px] w-[13px]" aria-hidden="true" />
              <span className="text-[12px] font-medium text-[#7a8187] capitalize">
                {inmueble.tipoInmueble}
              </span>
            </span>
            {inmueble.estrato && (
              <span className="text-[12px] font-medium text-[#7a8187]">
                Estrato {inmueble.estrato}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
