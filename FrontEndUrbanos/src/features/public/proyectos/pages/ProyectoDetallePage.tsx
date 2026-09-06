import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useArticuloPorSlug } from '@/features/public/proyectos/hooks/useProyectosPublico'
import { Spinner } from '@/shared/components/ui/Spinner'

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric', month: 'long', day: 'numeric',
})

/**
 * Detalle público de un proyecto — spec 06.
 * Markdown se renderiza con `marked` y se sanitiza con `DOMPurify`
 * antes de inyectar (XSS: admin puede poner `<script>` que se ignora).
 */
export function ProyectoDetallePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: articulo, isLoading, isError, error } = useArticuloPorSlug(slug)

  const htmlSanitizado = useMemo(() => {
    if (!articulo) return ''
    const raw = marked.parse(articulo.contenido, { async: false }) as string
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
  }, [articulo])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  if (isError || !articulo) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-24 text-center sm:px-12">
        <h1 className="text-[28px] font-extrabold text-[#001124]">Artículo no encontrado</h1>
        <p className="mt-2 text-[15px] text-[#7a8187]">
          {error instanceof Error ? error.message : 'Este artículo no existe o no está publicado.'}
        </p>
        <Link to="/proyectos" className="mt-6 inline-block text-[14px] font-semibold text-[#004b98] hover:underline">
          ← Volver a proyectos
        </Link>
      </div>
    )
  }

  return (
    <article className="bg-white px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-[760px]">
        <Link to="/proyectos" className="text-[13px] font-semibold text-[#004b98] hover:underline">
          ← Proyectos
        </Link>

        <header className="mt-6 flex flex-col gap-4">
          <p className="text-[12px] uppercase tracking-wider text-[#7a8187]">
            {articulo.publicadoEn ? formatoFecha.format(new Date(articulo.publicadoEn)) : ''}
          </p>
          <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-[-0.8px] text-[#001124]">
            {articulo.titulo}
          </h1>
          {articulo.resumen && (
            <p className="text-[18px] leading-[1.5] text-[#7a8187]">{articulo.resumen}</p>
          )}
        </header>

        {articulo.imagenPortadaUrl && (
          <img
            src={articulo.imagenPortadaUrl}
            alt={articulo.titulo}
            className="mt-8 aspect-[16/9] w-full rounded-[16px] object-cover"
          />
        )}

        <div
          className="mt-10 max-w-none text-[16px] leading-[1.8] text-[#001124] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[24px] [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[19px] [&_h3]:font-semibold [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_a]:text-[#004b98] [&_a]:underline [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[14px] [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-surface-muted [&_pre]:p-4 [&_pre]:text-[14px] [&_blockquote]:border-l-4 [&_blockquote]:border-[#d8dfe4] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#7a8187]"
          dangerouslySetInnerHTML={{ __html: htmlSanitizado }}
        />
      </div>
    </article>
  )
}
