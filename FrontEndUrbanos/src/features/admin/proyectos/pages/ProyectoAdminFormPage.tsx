import { useMemo, useState } from 'react'
import { useNavigate, useParams, type NavigateFunction } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  useActualizarArticulo,
  useArticuloAdmin,
  useCrearArticulo,
} from '@/features/admin/proyectos/hooks/useProyectosAdmin'
import type { ArticuloBlogAdmin } from '@/features/admin/proyectos/api/proyectosAdminApi'
import { subirImagenPortada } from '@/features/admin/proyectos/api/imagenPortadaApi'
import { Button } from '@/shared/components/ui/Button'
import { Input, Textarea } from '@/shared/components/ui/Field'
import { Spinner } from '@/shared/components/ui/Spinner'

/**
 * Form de crear/editar proyecto — spec 06.
 * Markdown con preview live + sanitización con DOMPurify antes de inyectar.
 */
export function ProyectoAdminFormPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const isEdit = Boolean(params.id)
  const idArticulo = isEdit ? Number(params.id) : undefined

  const { data: articuloExistente, isLoading: cargandoExistente } =
    useArticuloAdmin(idArticulo)

  if (isEdit && cargandoExistente) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  // `key` remonta el formulario cuando cambia el artículo cargado, así el
  // estado inicial se deriva directamente del dato en vez de sincronizarlo
  // con un setState dentro de un efecto (evitaba cascading renders).
  return (
    <FormularioArticulo
      key={idArticulo ?? 'nuevo'}
      idArticulo={idArticulo}
      articuloExistente={articuloExistente}
      navigate={navigate}
    />
  )
}

function FormularioArticulo({
  idArticulo,
  articuloExistente,
  navigate,
}: {
  idArticulo: number | undefined
  articuloExistente: ArticuloBlogAdmin | undefined
  navigate: NavigateFunction
}) {
  const isEdit = idArticulo !== undefined
  const crear = useCrearArticulo()
  const actualizar = useActualizarArticulo()

  const [titulo, setTitulo] = useState(articuloExistente?.titulo ?? '')
  const [resumen, setResumen] = useState(articuloExistente?.resumen ?? '')
  const [contenido, setContenido] = useState(articuloExistente?.contenido ?? '')
  const [imagenPortadaUrl, setImagenPortadaUrl] = useState(articuloExistente?.imagenPortadaUrl ?? '')
  const [metaTitulo, setMetaTitulo] = useState(articuloExistente?.metaTitulo ?? '')
  const [metaDescripcion, setMetaDescripcion] = useState(articuloExistente?.metaDescripcion ?? '')
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const [errorPortada, setErrorPortada] = useState<string | null>(null)

  async function handleSeleccionarPortada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo si falla
    if (!file || !idArticulo) return

    setErrorPortada(null)
    setSubiendoPortada(true)
    try {
      const url = await subirImagenPortada(idArticulo, file)
      setImagenPortadaUrl(url)
    } catch (err) {
      setErrorPortada(err instanceof Error ? err.message : 'No se pudo subir la imagen.')
    } finally {
      setSubiendoPortada(false)
    }
  }

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
      navigate('/admin/proyectos')
    } else {
      const { id } = await crear.mutateAsync(payload)
      navigate(`/admin/proyectos/${id}/editar`)
    }
  }

  const pendiente = crear.isPending || actualizar.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Escribe el cuerpo en Markdown. Se sanitiza antes de publicar.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/admin/proyectos')}>Cancelar</Button>
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
        <div className="mt-4">
          <p className="text-text-primary mb-1 block text-sm font-medium">Imagen de portada</p>

          {imagenPortadaUrl && (
            <img
              src={imagenPortadaUrl}
              alt="Portada actual"
              className="mb-2 h-32 w-auto rounded-control border border-border object-cover"
            />
          )}

          {isEdit ? (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={subiendoPortada}
                onChange={handleSeleccionarPortada}
                className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-control file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-text-secondary">JPG, PNG o WebP.</p>
              {subiendoPortada && (
                <p className="mt-1 text-xs text-text-secondary">Subiendo imagen…</p>
              )}
              {errorPortada && (
                <p className="mt-1 text-xs text-error">{errorPortada}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-text-secondary">
              Guarda el artículo primero: la portada se sube desde la pantalla de edición.
            </p>
          )}
        </div>
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
