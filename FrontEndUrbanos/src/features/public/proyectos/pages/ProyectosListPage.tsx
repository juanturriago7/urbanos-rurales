import { Container } from '@/shared/components/ui/Container'
import { Link } from 'react-router-dom'
import { useArticulosPublico } from '@/features/public/proyectos/hooks/useProyectosPublico'
import { Spinner } from '@/shared/components/ui/Spinner'
import { Foto } from '@/shared/components/ui/Foto'
import { FOTOS } from '@/assets/fotos'
import { site } from '@/shared/config/site'

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric', month: 'long', day: 'numeric',
})

/**
 * Listado público de proyectos — spec 06.
 * Solo muestra artículos con estado = publicado (lo filtra el backend).
 */
export function ProyectosListPage() {
  const { data, isLoading, isError, error } = useArticulosPublico(1, 12)

  return (
    <div className="min-h-screen bg-[#eff4f8] py-16">
      <Container>
        <header className="mb-10 flex flex-col gap-3 sm:mb-12">
          <span className="self-start rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
              Proyectos
            </span>
          </span>
          <h1 className="titulo-seccion text-[#001124]">
            Artículos y noticias
          </h1>
          <p className="texto-lead max-w-[640px] text-[#7a8187]">
            Análisis y contenido sobre el mercado inmobiliario, gestión predial y consultoría.
          </p>
        </header>

        {isLoading && (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        )}
        {isError && (
          <div className="rounded-(--radius-card) border border-red-200 bg-red-50 p-6 text-sm text-error">
            Error: {error instanceof Error ? error.message : 'desconocido'}
          </div>
        )}

        {data && data.items.length === 0 && (
          <p className="rounded-(--radius-card) border border-dashed border-border bg-white p-12 text-center text-[15px] text-text-secondary">
            Aún no hay artículos publicados.
          </p>
        )}

        {data && data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((a) => (
              <Link
                key={a.id}
                to={`/proyectos/${a.slug}`}
                className="group block overflow-hidden rounded-[18px] border border-[#d8dfe4] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,17,36,0.10)]"
              >
                {a.imagenPortadaUrl ? (
                  <div className="aspect-[382/220] overflow-hidden">
                    <img
                      src={a.imagenPortadaUrl}
                      alt={a.titulo}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  // Portada de marca para artículos sin imagen: foto genérica del
                  // territorio + nombre de la empresa. alt vacío: es decorativa.
                  <div className="relative aspect-[382/220] overflow-hidden">
                    <Foto
                      foto={FOTOS.portadaArticulo}
                      sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-end bg-[rgba(0,17,36,0.55)] p-4">
                      <span className="text-[12px] font-semibold tracking-[1.2px] text-white uppercase">
                        {site.nombreCorto}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-[12px] uppercase tracking-wider text-[#7a8187]">
                    {a.publicadoEn ? formatoFecha.format(new Date(a.publicadoEn)) : ''}
                  </p>
                  <h2 className="mt-1 text-[18px] font-bold leading-tight text-[#001124]">
                    {a.titulo}
                  </h2>
                  {a.resumen && (
                    <p className="mt-2 line-clamp-3 text-[14px] text-[#7a8187]">
                      {a.resumen}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
