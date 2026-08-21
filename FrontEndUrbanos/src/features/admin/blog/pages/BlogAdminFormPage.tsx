import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  useActualizarArticulo,
  useArticuloAdmin,
  useCrearArticulo,
} from '@/features/admin/blog/hooks/useBlogAdmin'
import { Button } from '@/shared/components/ui/Button'
import { Input, Textarea } from '@/shared/components/ui/Field'
import { Spinner } from '@/shared/components/ui/Spinner'

/**
 * Form de crear/editar artículo — spec 06.
 * Markdown con preview live + sanitización con DOMPurify antes de inyectar.
 */
export function BlogAdminFormPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const isEdit = Boolean(params.id)
  const idArticulo = isEdit ? Number(params.id) : undefined

  const { data: articuloExistente, isLoading: cargandoExistente } =
    useArticuloAdmin(idArticulo)
  const crear = useCrearArticulo()
  const actualizar = useActualizarArticulo()

  const [titulo, setTitulo] = useState('')
  const [resumen, setResumen] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagenPortadaUrl, setImagenPortadaUrl] = useState('')
  const [metaTitulo, setMetaTitulo] = useState('')
  const [metaDescripcion, setMetaDescripcion] = useState('')

  useEffect(() => {
    if (!articuloExistente) return
    setTitulo(articuloExistente.titulo)
    setResumen(articuloExistente.resumen ?? '')
    setContenido(articuloExistente.contenido)
    setImagenPortadaUrl(articuloExistente.imagenPortadaUrl ?? '')
    setMetaTitulo(articuloExistente.metaTitulo ?? '')
    setMetaDescripcion(articuloExistente.metaDescripcion ?? '')
  }, [articuloExistente])

  const htmlPreview = useMemo(() => {
    const raw = marked.parse(contenido, { async: false }) as string
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
  }, [contenido])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !contenido.trim()) return

    const payload = {
      titulo: titulo.trim(),
      contenido,
      resumen: resumen.trim() || null,
      imagenPortadaUrl: imagenPortadaUrl.trim() || null,
      metaTitulo: metaTitulo.trim() || null,
      metaDescripcion: metaDescripcion.trim() || null,
    }

    if (isEdit && idArticulo) {
      await actualizar.mutateAsync({ id: idArticulo, input: payload })
      navigate('/admin/blog')
    } else {
      const { id } = await crear.mutateAsync(payload)
      navigate(`/admin/blog/${id}/editar`)
    }
  }

  if (isEdit && cargandoExistente) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  const pendiente = crear.isPending || actualizar.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            {isEdit ? 'Editar artículo' : 'Nuevo artículo'}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Escribe el cuerpo en Markdown. Se sanitiza antes de publicar.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/admin/blog')}>Cancelar</Button>
      </div>

      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <Input
          label="Título"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título del artículo"
        />
        <Input
          label="Resumen"
          hint="Máx 320 caracteres. Aparece en la tarjeta del listado."
          wrapperClassName="mt-4"
          value={resumen}
          maxLength={320}
          onChange={(e) => setResumen(e.target.value)}
        />
        <Input
          label="URL de imagen de portada"
          wrapperClassName="mt-4"
          value={imagenPortadaUrl}
          onChange={(e) => setImagenPortadaUrl(e.target.value)}
          placeholder="https://..."
        />
        <Input
          label="Meta título (SEO)"
          wrapperClassName="mt-4"
          value={metaTitulo}
          onChange={(e) => setMetaTitulo(e.target.value)}
        />
        <Input
          label="Meta descripción (SEO)"
          wrapperClassName="mt-4"
          value={metaDescripcion}
          maxLength={320}
          onChange={(e) => setMetaDescripcion(e.target.value)}
        />
      </section>

      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Contenido (Markdown)
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Textarea
            label="Markdown"
            required
            rows={20}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="# Encabezado..."
          />
          <div>
            <p className="text-text-primary mb-1 block text-sm font-medium">Vista previa</p>
            <div
              className="min-h-[300px] max-w-none rounded-control border border-border bg-surface-muted p-3 text-sm text-text-primary [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:text-[15px] [&_h3]:font-semibold [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand-700 [&_a]:underline [&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_code]:py-0.5 [&_pre]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-white [&_pre]:p-2 [&_pre]:text-[12px]"
              dangerouslySetInnerHTML={{ __html: htmlPreview || '<em class="text-text-secondary">Vacío</em>' }}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={pendiente}>
          {isEdit ? 'Guardar cambios' : 'Crear artículo'}
        </Button>
      </div>
    </form>
  )
}
