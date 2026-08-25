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
      // `key={id}` es obligatorio, no decorativo. React Router reutiliza esta
      // misma instancia al pasar de /properties/1/editar a /properties/2/editar,
      // y si el detalle del 2 ya está en caché (staleTime de 5 min) React Query
      // lo devuelve de forma síncrona: `isLoading` nunca se pone en true, el
      // guard de arriba no dispara, y el formulario NO se desmonta. Sin la key
      // seguiría mostrando los valores del inmueble 1 mientras `id` y
      // `operaciones` ya son del 2 — y guardar escribiría los datos del 1 sobre
      // el 2. Ver el docblock de `valoresIniciales` en InmuebleForm.
      key={id}
      valoresIniciales={aValoresFormulario(inmueble)}
      onSubmit={onSubmit}
      enviando={isPending}
      textoBoton="Guardar cambios"
      panelFotos={<GaleriaImagenes inmuebleId={id} />}
    />
  )
}
