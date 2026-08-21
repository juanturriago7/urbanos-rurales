import { BedDouble, House, MapPin, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePublicaciones } from '@/features/public/properties/hooks/usePublicaciones'

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

/**
 * Sección de publicaciones en el home — spec 05.
 *
 * Antes: estaba comentada por completo en HomePage.tsx y usaba un lenguaje
 * editorial propio (serif + paleta tostada) que la hacía sentir ajena al
 * resto del home (sans, paleta azul #004b98/#00b5c5). Ahora comparte paleta
 * y tipografía, y el header tiene más peso que el resto de secciones porque
 * es contenido transaccional, no institucional.
 *
 * Si no hay publicaciones o la API falla, la sección no se renderiza (mejor
 * ausente que un hueco o un error visible debajo del hero).
 */
export function PublicacionesDestacadas() {
  const { data, isLoading, isError } = usePublicaciones({ pageSize: 6 })

  if (isError) return null
  if (!isLoading && (!data || data.items.length === 0)) return null

  return (
    <section className="bg-[#eff4f8] py-24 px-12">
      <div className="max-w-[1200px] mx-auto">
        {/* Header de sección — más prominente que el resto */}
        <div className="reveal mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <span className="self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">
                Publicaciones
              </span>
            </span>
            <h2 className="font-extrabold text-[#001124] text-[42px] leading-[1.1] tracking-[-0.8px]">
              Inmuebles disponibles
            </h2>
            <p className="text-[#7a8187] text-[16px] max-w-[560px]">
              Una selección de las propiedades más recientes de nuestro portafolio.
            </p>
          </div>
          <Link
            to="/inmuebles"
            className="inline-flex items-center gap-2 bg-[#004b98] text-white font-semibold text-[14px] px-6 py-3 rounded-[10px] hover:bg-[#003b7a] transition-colors self-start sm:self-auto"
          >
            Ver todas las propiedades →
          </Link>
        </div>

        {/* Skeletons de carga */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-[#d8dfe4] rounded-[18px] overflow-hidden animate-pulse"
              >
                <div className="bg-[#e0e5e9]" style={{ aspectRatio: '382/286.5' }} />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-5 bg-[#e0e5e9] rounded w-1/3" />
                  <div className="h-4 bg-[#e0e5e9] rounded w-3/4" />
                  <div className="h-3 bg-[#e0e5e9] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid de tarjetas — mismo lenguaje que /inmuebles para consistencia */}
        {!isLoading && data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((inmueble) => {
              const { texto: precio, operacion } = formatPrice(
                inmueble.precioVenta,
                inmueble.precioArriendo,
              )
              const badgeBg = operacion === 'Arriendo' ? 'bg-[#df500c]' : 'bg-[#00b5c5]'
              const badgeTxt = operacion === 'Arriendo' ? 'text-white' : 'text-[#001124]'

              return (
                <article
                  key={inmueble.id}
                  className="group relative bg-white border border-[#d8dfe4] rounded-[18px] overflow-hidden p-px flex flex-col hover:shadow-[0_8px_32px_rgba(0,17,36,0.10)] hover:-translate-y-0.5 transition-all duration-300"
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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background:
                              'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)',
                          }}
                        >
                          <span className="text-[rgba(255,255,255,0.4)] text-[11px] text-center px-4">
                            Sin fotografía disponible
                          </span>
                        </div>
                      )}
                      {operacion && (
                        <span
                          className={`absolute top-3.5 left-3.5 ${badgeBg} ${badgeTxt} text-[11px] font-bold tracking-[0.33px] px-3 py-1.5 rounded-full`}
                        >
                          {operacion}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-1 p-5">
                      <p className="font-extrabold text-[#004b98] text-[20px] tracking-[-0.5px] leading-none">
                        {precio}
                      </p>
                      <p className="font-bold text-[#001124] text-[15px] leading-snug mt-0.5 line-clamp-2">
                        {inmueble.titulo}
                      </p>
                      <div className="flex items-center gap-[5px] pb-2.5 text-[#7a8187]">
                        <MapPin className="w-[13px] h-[13px] shrink-0" aria-hidden="true" />
                        <span className="text-[#7a8187] text-[13px] truncate">
                          {inmueble.ubicacion}
                        </span>
                      </div>
                      <div className="border-t border-[#e0e5e9] pt-[15px] flex flex-wrap gap-x-[14px] gap-y-1 items-center">
                        {inmueble.areaConstruidaM2 && (
                          <span className="flex items-center gap-[5px] text-[#7a8187]">
                            <Ruler className="w-[13px] h-[13px]" aria-hidden="true" />
                            <span className="text-[#7a8187] text-[12px] font-medium">
                              {inmueble.areaConstruidaM2} m²
                            </span>
                          </span>
                        )}
                        {inmueble.habitaciones > 0 && (
                          <span className="flex items-center gap-[5px] text-[#7a8187]">
                            <BedDouble className="w-[13px] h-[13px]" aria-hidden="true" />
                            <span className="text-[#7a8187] text-[12px] font-medium">
                              {inmueble.habitaciones} hab
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-[5px] text-[#7a8187]">
                          <House className="w-[13px] h-[13px]" aria-hidden="true" />
                          <span className="text-[#7a8187] text-[12px] font-medium capitalize">
                            {inmueble.tipoInmueble}
                          </span>
                        </span>
                        {inmueble.estrato && (
                          <span className="text-[#7a8187] text-[12px] font-medium">
                            Estrato {inmueble.estrato}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
