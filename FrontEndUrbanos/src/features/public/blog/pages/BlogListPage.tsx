import { Link } from 'react-router-dom'
import { useArticulosPublico } from '@/features/public/blog/hooks/useBlogPublico'
import { Spinner } from '@/shared/components/ui/Spinner'

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric', month: 'long', day: 'numeric',
})

/**
 * Listado público de artículos del blog — spec 06.
 * Solo muestra artículos con estado = publicado (lo filtra el backend).
 */
export function BlogListPage() {
  const { data, isLoading, isError, error } = useArticulosPublico(1, 12)

  return (
    <div className="bg-[#eff4f8] min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-12 flex flex-col gap-3">
          <span className="self-start rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
              Blog
            </span>
          </span>
          <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-[-0.8px] text-[#001124]">
            Artículos y noticias
          </h1>
          <p className="max-w-[640px] text-[16px] leading-[1.65] text-[#7a8187]">
            Análisis y contenido sobre el mercado inmobiliario, gestión predial y consultoría.
          </p>
        </header>

        {isLoading && (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        )}
        {isError && (
          <div className="rounded-[--radius-card] border border-red-200 bg-red-50 p-6 text-sm text-error">
            Error: {error instanceof Error ? error.message : 'desconocido'}
          </div>
        )}

        {data && data.items.length === 0 && (
          <p className="rounded-[--radius-card] border border-dashed border-border bg-white p-12 text-center text-[15px] text-text-secondary">
            Aún no hay artículos publicados.
          </p>
        )}

        {data && data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((a) => (
              <Link
                key={a.id}
                to={`/blog/${a.slug}`}
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
                  <div
                    className="flex aspect-[382/220] items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)' }}
                  >
                    <span className="text-[rgba(255,255,255,0.4)] text-[11px]">Sin portada</span>
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
      </div>
    </div>
  )
}
