import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrearInmueble } from '@/features/admin/properties/hooks/useInmuebles'
import { Button } from '@/shared/components/ui/Button'
import { InmuebleForm } from '@/features/admin/properties/components/InmuebleForm'
import { TarjetaFotos } from '@/features/admin/properties/components/TarjetaFotos'
import type { CrearInmuebleInput } from '@/features/admin/properties/api/inmueblesApi'
import {
  aDatosInput,
  aOperacionesUpsert,
} from '@/features/admin/properties/schemas/inmuebleMappers'
import type { InmuebleFormParsed } from '@/features/admin/properties/schemas/inmuebleSchema'

/**
 * Alta de inmueble (RF-070, RF-072, RF-076, RF-077).
 * El backend lo crea siempre en estado borrador; publicar es una acción aparte
 * desde el listado.
 *
 * El formulario en sí vive en InmuebleForm, compartido con la pantalla de
 * edición; aquí solo queda lo propio de la creación.
 */

export function InmuebleFormPage() {
  const navigate = useNavigate()
  const { mutateAsync: crear, isPending } = useCrearInmueble()

  // Las imágenes necesitan un inmuebleId real (RF-090..094: la ruta de subida
  // es /admin/inmuebles/{id}/imagenes), así que no pueden pedirse antes de
  // crear el registro. Ese orden no cambia; lo que cambia es que ya no se
  // reemplaza toda la página por una pantalla aparte — el formulario se
  // bloquea en el sitio y la tarjeta de fotos de la sidebar pasa de
  // "bloqueada" a la galería real (ver TarjetaFotos).
  const [inmuebleCreadoId, setInmuebleCreadoId] = useState<number | null>(null)

  const onSubmit = async (datos: InmuebleFormParsed) => {
    // Sin operaciones previas aOperacionesUpsert nunca emite desactivaciones,
    // así que devuelve exactamente las operaciones marcadas; `activo`/`estado`
    // no van en el body de creación.
    const payload: CrearInmuebleInput = {
      ...aDatosInput(datos),
      operaciones: aOperacionesUpsert(datos, []).map((o) => ({
        tipoOperacion: o.tipoOperacion,
        precio: o.precio,
        cuotaAdministracion: o.cuotaAdministracion,
        adminIncluida: o.adminIncluida,
      })),
    }

    const id = await crear(payload)
    setInmuebleCreadoId(id)
  }

  const yaCreado = inmuebleCreadoId !== null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-text-primary text-xl font-semibold">Nuevo inmueble</h2>
          <p className="text-text-secondary mt-1 text-sm">
            Se crea en estado <strong>borrador</strong>. Podrás publicarlo desde el listado.
          </p>
        </div>
        {!yaCreado && (
          <Button variant="ghost" onClick={() => navigate('/admin/properties')}>
            Cancelar
          </Button>
        )}
      </div>

      {yaCreado && (
        <div className="mt-4 rounded-[--radius-card] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Inmueble creado en borrador. Ya puedes subir fotos o terminar.
        </div>
      )}

      <InmuebleForm
        onSubmit={onSubmit}
        enviando={isPending}
        textoBoton="Crear inmueble"
        deshabilitado={yaCreado}
        // Ya creado el formulario se bloquea y desaparece el submit: la única
        // salida es este botón, que ocupa su lugar en la sidebar.
        accionPrincipal={
          yaCreado ? (
            <Button type="button" className="w-full" onClick={() => navigate('/admin/properties')}>
              Ir al listado
            </Button>
          ) : undefined
        }
        panelFotos={<TarjetaFotos inmuebleId={inmuebleCreadoId} />}
      />
    </div>
  )
}
