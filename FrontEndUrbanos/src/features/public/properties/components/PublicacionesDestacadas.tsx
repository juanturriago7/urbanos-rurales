import { usePublicaciones } from '@/features/public/properties/hooks/usePublicaciones'

const IconArrow = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-3.5 w-3.5"
    aria-hidden="true"
  >
    <path d="M2 7h10M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/**
 * Publicaciones recientes, directo en la página de inicio.
 *
 * Consume GET /api/inmuebles (público, sin auth) y no requiere navegar a
 * ninguna otra ruta para verse: si no hay nada publicado, la sección no se
 * renderiza — mejor ausente que una grilla vacía debajo del hero.
 */
export function PublicacionesDestacadas() {
  const { data, isLoading, isError } = usePublicaciones({ pageSize: 6 })

  if (isError) return null
  if (!isLoading && (!data || data.items.length === 0)) return null

  return (
    <section className="mx-auto max-w-350 px-6 py-24 sm:px-10">
      <div className="reveal mb-14 flex items-end justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold tracking-[4px] text-[#8b6f4e] uppercase">
            Publicaciones
          </span>
          <h2 className="mt-2 font-serif text-[34px] leading-tight font-bold text-[#1c1917]">
            Propiedades disponibles
          </h2>
        </div>
        <a
          href="/inmuebles"
          className="hidden items-center gap-2 text-[10px] font-bold tracking-[2px] text-[#8b6f4e] uppercase transition-colors hover:text-[#735840] sm:inline-flex"
        >
          Ver todas <IconArrow />
        </a>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-sm border border-border bg-surface-muted"
            />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((inmueble) => {
            const precio = inmueble.precioVenta ?? inmueble.precioArriendo
            const etiquetaOperacion = inmueble.precioVenta ? 'Venta' : 'Arriendo'

            return (
              <article
                key={inmueble.id}
                className="group overflow-hidden rounded-sm border border-border bg-white transition-all duration-300 hover:border-[#8b6f4e]/40 hover:shadow-[0_8px_32px_rgba(28,25,23,0.07)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                  {inmueble.imagenPortada ? (
                    <img
                      src={inmueble.imagenPortada}
                      alt={inmueble.titulo}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary">
                      Sin foto
                    </div>
                  )}
                  <span className="absolute top-3 left-3 rounded-sm bg-[#1c1917] px-2 py-1 text-[9px] font-bold tracking-[1.5px] text-white uppercase">
                    {etiquetaOperacion}
                  </span>
                </div>

                <div className="p-5">
                  <p className="font-serif text-[16px] leading-tight font-bold text-[#1c1917]">
                    {inmueble.titulo}
                  </p>
                  <p className="mt-1 text-[12px] text-[#1c1917]/50">
                    {inmueble.tipoInmueble} · {inmueble.ubicacion}
                  </p>

                  <p className="mt-3 text-[11px] text-[#1c1917]/40">
                    {inmueble.habitaciones} hab · {inmueble.banos} baños
                    {inmueble.parqueaderos > 0 && ` · ${inmueble.parqueaderos} parq.`}
                  </p>

                  {precio !== null && (
                    <p className="mt-3 font-serif text-[18px] font-bold text-[#8b6f4e]">
                      {formatoPesos.format(precio)}
                      {etiquetaOperacion === 'Arriendo' && (
                        <span className="text-[11px] font-normal text-[#1c1917]/40"> /mes</span>
                      )}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
