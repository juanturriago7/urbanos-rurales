import { useRef, useState } from 'react'
import {
  useEliminarImagen,
  useImagenes,
  useMarcarPortada,
  useSubirImagen,
} from '@/features/admin/properties/hooks/useImagenes'
import { mensajeDeError } from '@/features/admin/auth/hooks/useLogin'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'

const MAX_IMAGENES = 10
const FORMATOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp']

interface GaleriaImagenesProps {
  inmuebleId: number
}

/**
 * Galería de fotos de un inmueble (RF-090 a RF-094): sube directo al bucket
 * vía URL prefirmada, marca portada y elimina. Requiere que el inmueble ya
 * exista — por eso solo aparece después de crear el registro (InmuebleFormPage).
 */
export function GaleriaImagenes({ inmuebleId }: GaleriaImagenesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: imagenes, isLoading } = useImagenes(inmuebleId)
  const subir = useSubirImagen(inmuebleId)
  const marcarPortada = useMarcarPortada(inmuebleId)
  const eliminar = useEliminarImagen(inmuebleId)

  const total = imagenes?.length ?? 0
  const alMaximo = total >= MAX_IMAGENES

  const alSeleccionarArchivos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return
    setError(null)

    for (const archivo of Array.from(archivos)) {
      if (!FORMATOS_ACEPTADOS.includes(archivo.type)) {
        setError(`"${archivo.name}" no es JPG, PNG ni WEBP.`)
        continue
      }
      if ((imagenes?.length ?? 0) >= MAX_IMAGENES) {
        setError(`Ya alcanzaste el máximo de ${MAX_IMAGENES} imágenes.`)
        break
      }
      try {
        await subir.mutateAsync(archivo)
      } catch (e) {
        setError(mensajeDeError(e, `No se pudo subir "${archivo.name}".`))
      }
    }

    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Fotos
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Se requiere al menos una para publicar (RF-077). Máximo {MAX_IMAGENES}, JPG/PNG/WEBP.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={FORMATOS_ACEPTADOS.join(',')}
            multiple
            className="hidden"
            onChange={(e) => alSeleccionarArchivos(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            disabled={alMaximo || subir.isPending}
            isLoading={subir.isPending}
            onClick={() => inputRef.current?.click()}
          >
            Subir fotos
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-6 flex justify-center">
          <Spinner size="md" />
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="mt-4 rounded-[--radius-card] border border-dashed border-border p-8 text-center text-sm text-text-secondary">
          Todavía no hay fotos. La primera que subas queda como portada.
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          {imagenes!.map((imagen) => (
            <div
              key={imagen.id}
              className="group relative overflow-hidden rounded-[--radius-card] border border-border"
            >
              <img
                src={imagen.urlCdn}
                alt={imagen.textoAlt ?? ''}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />

              {imagen.esPortada && (
                <span className="absolute top-1.5 left-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Portada
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!imagen.esPortada && (
                  <button
                    type="button"
                    disabled={marcarPortada.isPending}
                    onClick={() => marcarPortada.mutate(imagen.id)}
                    className="rounded px-1.5 py-1 text-[11px] font-medium text-white hover:bg-white/20"
                  >
                    Marcar portada
                  </button>
                )}
                <button
                  type="button"
                  disabled={eliminar.isPending}
                  onClick={() => eliminar.mutate(imagen.id)}
                  className="ml-auto rounded px-1.5 py-1 text-[11px] font-medium text-white hover:bg-white/20"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
