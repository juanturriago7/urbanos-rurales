import { useNavigate, useParams } from 'react-router-dom'
import { useInmueble, useActualizarInmueble } from '@/features/admin/properties/hooks/useInmuebles'
import { InmuebleForm } from '@/features/admin/properties/components/InmuebleForm'
import { GaleriaImagenes } from '@/features/admin/properties/components/GaleriaImagenes'
import {
  aDatosInput,
  aOperacionesUpsert,
  aValoresFormulario,
} from '@/features/admin/properties/schemas/inmuebleMappers'
import type { InmuebleFormParsed } from '@/features/admin/properties/schemas/inmuebleSchema'
import { Spinner } from '@/shared/components/ui/Spinner'
import { Button } from '@/shared/components/ui/Button'

/** Edición de un inmueble existente (RF-072). Los campos, las operaciones y las fotos. */
export function InmuebleEditarPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const esIdValido = Number.isFinite(id) && id > 0

  const { data: inmueble, isLoading, isError } = useInmueble(esIdValido ? id : undefined)
  const { mutateAsync: actualizar, isPending } = useActualizarInmueble()

  if (!esIdValido || isError) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
        <p className="text-error">Inmueble no encontrado.</p>
        <Button variant="ghost" className="mt-3" onClick={() => navigate('/admin/properties')}>
          Volver al listado
        </Button>
      </div>
    )
  }

  if (isLoading || !inmueble) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const onSubmit = async (datos: InmuebleFormParsed) => {
    await actualizar({
      id,
      datos: aDatosInput(datos),
      operaciones: aOperacionesUpsert(datos, inmueble.operaciones),
    })
  }

  return (
    <InmuebleForm
      valoresIniciales={aValoresFormulario(inmueble)}
      onSubmit={onSubmit}
      enviando={isPending}
      textoBoton="Guardar cambios"
      panelFotos={<GaleriaImagenes inmuebleId={id} />}
    />
  )
}
