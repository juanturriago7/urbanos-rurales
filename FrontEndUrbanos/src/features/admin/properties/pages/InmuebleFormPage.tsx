import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useCrearInmueble } from '@/features/admin/properties/hooks/useInmuebles'
import {
  useCaracteristicas,
  useTiposInmueble,
  useUbicaciones,
} from '@/features/admin/catalogos/hooks/useCatalogos'
import { aplanarUbicaciones } from '@/features/admin/catalogos/api/catalogosApi'
import { mensajeDeError } from '@/features/admin/auth/hooks/useLogin'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { Input, Select, Textarea } from '@/shared/components/ui/Field'
import { TarjetaFotos } from '@/features/admin/properties/components/TarjetaFotos'
import type { CrearInmuebleInput } from '@/features/admin/properties/api/inmueblesApi'

/**
 * Alta de inmueble (RF-070, RF-072, RF-076, RF-077).
 * El backend lo crea siempre en estado borrador; publicar es una acción aparte
 * desde el listado.
 *
 * Las reglas replican las del validador de FluentValidation del backend
 * (InmuebleDatosValidatorBase) para dar retroalimentación inmediata; el backend
 * sigue siendo la autoridad y sus mensajes se muestran si algo se escapa.
 */

// Los <input type="number"> entregan string; se convierten antes de validar.
//
// Es imprescindible aceptar `undefined`: los campos de una operación solo se
// renderizan cuando su checkbox está marcado, así que mientras estén ocultos
// nunca se registran y llegan como undefined. Si el esquema los rechaza, la
// validación falla en un campo que no está en pantalla y el submit se aborta
// sin mostrar ningún error.
const numeroOpcional = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))

const numeroRequerido = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)))

const textoOpcional = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))

const inmuebleSchema = z
  .object({
    titulo: z.string().trim().min(1, 'El título es obligatorio').max(160, 'Máximo 160 caracteres'),
    descripcion: textoOpcional,
    tipoInmuebleId: numeroRequerido.refine((v) => v > 0, 'Selecciona un tipo de inmueble'),
    ubicacionId: numeroRequerido.refine((v) => v > 0, 'Selecciona una ubicación'),
    direccionExacta: z
      .string()
      .trim()
      .min(1, 'La dirección es obligatoria')
      .max(200, 'Máximo 200 caracteres'),

    latitudAproximada: numeroRequerido
      .refine((v) => !Number.isNaN(v), 'La latitud es obligatoria')
      .refine((v) => v >= -90 && v <= 90, 'Debe estar entre -90 y 90'),
    longitudAproximada: numeroRequerido
      .refine((v) => !Number.isNaN(v), 'La longitud es obligatoria')
      .refine((v) => v >= -180 && v <= 180, 'Debe estar entre -180 y 180'),

    areaConstruidaM2: numeroOpcional.refine((v) => v === null || v > 0, 'Debe ser mayor que 0'),
    areaPrivadaM2: numeroOpcional.refine((v) => v === null || v > 0, 'Debe ser mayor que 0'),

    habitaciones: numeroRequerido.refine((v) => v >= 0, 'No puede ser negativo'),
    banos: numeroRequerido.refine((v) => v >= 0, 'No puede ser negativo'),
    parqueaderos: numeroRequerido.refine((v) => v >= 0, 'No puede ser negativo'),

    piso: numeroOpcional,
    pisosEdificio: numeroOpcional,
    estrato: numeroOpcional.refine(
      (v) => v === null || (v >= 1 && v <= 6),
      'El estrato debe estar entre 1 y 6',
    ),
    antiguedad: textoOpcional,
    orientacion: textoOpcional,

    politicaMascotas: z.enum(['permitidas', 'no_permitidas', 'con_restricciones']),
    amoblado: z.enum(['si', 'no', 'semi']),
    matriculaInmobiliaria: textoOpcional,

    // ── Operaciones (RF-076): venta y/o arriendo, al menos una ────────────────
    tieneVenta: z.boolean(),
    precioVenta: numeroOpcional,
    adminVenta: numeroOpcional,

    tieneArriendo: z.boolean(),
    precioArriendo: numeroOpcional,
    adminArriendo: numeroOpcional,
    adminIncluidaArriendo: z.boolean(),

    // Un grupo de checkboxes con el mismo `name` devuelve las opciones marcadas
    // como strings (el atributo `value` del DOM), no como números. Se acepta
    // cualquiera de los dos y se normaliza aquí.
    caracteristicaIds: z
      .array(z.union([z.string(), z.number()]))
      .default([])
      .transform((ids) => ids.map(Number).filter((n) => Number.isFinite(n))),
  })
  .refine((d) => d.tieneVenta || d.tieneArriendo, {
    message: 'Debes registrar al menos una operación: venta o arriendo',
    path: ['tieneVenta'],
  })
  .refine((d) => !d.tieneVenta || (d.precioVenta !== null && d.precioVenta > 0), {
    message: 'Ingresa el precio de venta',
    path: ['precioVenta'],
  })
  .refine((d) => !d.tieneArriendo || (d.precioArriendo !== null && d.precioArriendo > 0), {
    message: 'Ingresa el canon de arriendo',
    path: ['precioArriendo'],
  })

type InmuebleForm = z.input<typeof inmuebleSchema>
type InmuebleFormParsed = z.output<typeof inmuebleSchema>

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

  const tipos = useTiposInmueble()
  const ubicaciones = useUbicaciones()
  const caracteristicas = useCaracteristicas()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<InmuebleForm, unknown, InmuebleFormParsed>({
    resolver: zodResolver(inmuebleSchema),
    defaultValues: {
      politicaMascotas: 'no_permitidas',
      amoblado: 'no',
      habitaciones: 0,
      banos: 0,
      parqueaderos: 0,
      tieneVenta: true,
      tieneArriendo: false,
      adminIncluidaArriendo: false,
      caracteristicaIds: [],
    },
  })

  // useWatch en vez de watch(): watch() devuelve una función no memoizable y el
  // compilador de React descarta la optimización del componente entero.
  const tieneVenta = useWatch({ control, name: 'tieneVenta' })
  const tieneArriendo = useWatch({ control, name: 'tieneArriendo' })

  const opcionesUbicacion = ubicaciones.data ? aplanarUbicaciones(ubicaciones.data) : []

  /**
   * Red de seguridad: si la validación rechaza un campo que no está en pantalla
   * —por estar dentro de una sección colapsada, por ejemplo— el submit se
   * abortaría sin señal alguna. Aquí se nombra el campo culpable.
   */
  const alFallarValidacion = (fallos: Record<string, unknown>) => {
    const campos = Object.keys(fallos).filter((c) => c !== 'root')
    if (campos.length > 0) {
      setError('root', {
        message: `Revisa estos campos: ${campos.join(', ')}.`,
      })
    }
  }

  const onSubmit = async (datos: InmuebleFormParsed) => {
    const payload: CrearInmuebleInput = {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      tipoInmuebleId: datos.tipoInmuebleId,
      ubicacionId: datos.ubicacionId,
      direccionExacta: datos.direccionExacta,
      latitudAproximada: datos.latitudAproximada,
      longitudAproximada: datos.longitudAproximada,
      areaConstruidaM2: datos.areaConstruidaM2,
      areaPrivadaM2: datos.areaPrivadaM2,
      habitaciones: datos.habitaciones,
      banos: datos.banos,
      parqueaderos: datos.parqueaderos,
      piso: datos.piso,
      pisosEdificio: datos.pisosEdificio,
      estrato: datos.estrato,
      antiguedad: datos.antiguedad,
      orientacion: datos.orientacion,
      politicaMascotas: datos.politicaMascotas,
      amoblado: datos.amoblado,
      matriculaInmobiliaria: datos.matriculaInmobiliaria,
      caracteristicas: datos.caracteristicaIds.map((id) => ({ caracteristicaId: id })),
      operaciones: [
        ...(datos.tieneVenta
          ? [
              {
                tipoOperacion: 'venta' as const,
                precio: datos.precioVenta!,
                cuotaAdministracion: datos.adminVenta,
                adminIncluida: false,
              },
            ]
          : []),
        ...(datos.tieneArriendo
          ? [
              {
                tipoOperacion: 'arriendo' as const,
                precio: datos.precioArriendo!,
                cuotaAdministracion: datos.adminArriendo,
                adminIncluida: datos.adminIncluidaArriendo,
              },
            ]
          : []),
      ],
    }

    try {
      const id = await crear(payload)
      setInmuebleCreadoId(id)
    } catch (error) {
      setError('root', {
        message: mensajeDeError(error, 'No se pudo crear el inmueble.'),
      })
    }
  }

  if (tipos.isLoading || ubicaciones.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (tipos.isError || ubicaciones.isError) {
    return (
      <div className="text-error mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
        No se pudieron cargar los catálogos. Verifica que el backend esté corriendo.
      </div>
    )
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

      <form
        onSubmit={handleSubmit(onSubmit, alFallarValidacion)}
        noValidate
        className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px] xl:items-start"
      >
        <fieldset disabled={yaCreado} className="m-0 min-w-0 space-y-6 border-0 p-0">
          {/* ── Identificación ───────────────────────────────────────────────── */}
          <Seccion titulo="Identificación">
            <Input
              label="Título"
              required
              placeholder="Apartamento en Chapinero con vista"
              wrapperClassName="sm:col-span-2"
              error={errors.titulo?.message}
              {...register('titulo')}
            />

            <Select
              label="Tipo de inmueble"
              required
              error={errors.tipoInmuebleId?.message}
              {...register('tipoInmuebleId')}
            >
              <option value="">Selecciona…</option>
              {tipos.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>

            <Select
              label="Ubicación"
              required
              hint="Zona, localidad o UPZ — elige el nivel más específico que conozcas."
              error={errors.ubicacionId?.message}
              {...register('ubicacionId')}
            >
              <option value="">Selecciona…</option>
              {opcionesUbicacion.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.etiqueta}
                </option>
              ))}
            </Select>

            <Textarea
              label="Descripción"
              rows={4}
              wrapperClassName="sm:col-span-2"
              error={errors.descripcion?.message}
              {...register('descripcion')}
            />
          </Seccion>

          {/* ── Ubicación física ─────────────────────────────────────────────── */}
          <Seccion titulo="Dirección y coordenadas">
            <Input
              label="Dirección exacta"
              required
              placeholder="Calle 63 # 11-20"
              hint="Solo visible en el panel: el sitio público muestra la ubicación aproximada."
              wrapperClassName="sm:col-span-2"
              error={errors.direccionExacta?.message}
              {...register('direccionExacta')}
            />
            <Input
              label="Latitud aproximada"
              required
              type="number"
              step="any"
              placeholder="4.6486"
              error={errors.latitudAproximada?.message}
              {...register('latitudAproximada')}
            />
            <Input
              label="Longitud aproximada"
              required
              type="number"
              step="any"
              placeholder="-74.0628"
              error={errors.longitudAproximada?.message}
              {...register('longitudAproximada')}
            />
          </Seccion>

          {/* ── Ficha técnica ────────────────────────────────────────────────── */}
          <Seccion
            titulo="Ficha técnica"
            gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <Input
              label="Área construida (m²)"
              type="number"
              step="0.01"
              error={errors.areaConstruidaM2?.message}
              {...register('areaConstruidaM2')}
            />
            <Input
              label="Área privada (m²)"
              type="number"
              step="0.01"
              error={errors.areaPrivadaM2?.message}
              {...register('areaPrivadaM2')}
            />
            <Input
              label="Habitaciones"
              required
              type="number"
              min={0}
              error={errors.habitaciones?.message}
              {...register('habitaciones')}
            />
            <Input
              label="Baños"
              required
              type="number"
              min={0}
              error={errors.banos?.message}
              {...register('banos')}
            />
            <Input
              label="Parqueaderos"
              required
              type="number"
              min={0}
              error={errors.parqueaderos?.message}
              {...register('parqueaderos')}
            />
            <Input
              label="Estrato"
              type="number"
              min={1}
              max={6}
              error={errors.estrato?.message}
              {...register('estrato')}
            />
            <Input label="Piso" type="number" error={errors.piso?.message} {...register('piso')} />
            <Input
              label="Pisos del edificio"
              type="number"
              error={errors.pisosEdificio?.message}
              {...register('pisosEdificio')}
            />
            <Input
              label="Antigüedad"
              placeholder="5 a 10 años"
              error={errors.antiguedad?.message}
              {...register('antiguedad')}
            />
            <Input
              label="Orientación"
              placeholder="Norte"
              error={errors.orientacion?.message}
              {...register('orientacion')}
            />
            <Select label="Amoblado" {...register('amoblado')}>
              <option value="no">No</option>
              <option value="semi">Semiamoblado</option>
              <option value="si">Sí</option>
            </Select>
            <Select label="Política de mascotas" {...register('politicaMascotas')}>
              <option value="no_permitidas">No permitidas</option>
              <option value="permitidas">Permitidas</option>
              <option value="con_restricciones">Con restricciones</option>
            </Select>
            <Input
              label="Matrícula inmobiliaria"
              wrapperClassName="sm:col-span-2"
              error={errors.matriculaInmobiliaria?.message}
              {...register('matriculaInmobiliaria')}
            />
          </Seccion>

          {/* ── Operaciones ──────────────────────────────────────────────────── */}
          <section className="border-border rounded-[--radius-card] border bg-white p-5 shadow-sm">
            <h3 className="text-text-secondary text-sm font-semibold tracking-wider uppercase">
              Operaciones
            </h3>
            <p className="text-text-secondary mt-1 text-xs">
              Un inmueble puede estar en venta, en arriendo o en ambas.
            </p>

            {errors.tieneVenta?.message && (
              <p className="text-error mt-2 text-xs">{errors.tieneVenta.message}</p>
            )}

            <div className="mt-4 space-y-4">
              <div className="border-border rounded-lg border p-4">
                <label className="text-text-primary flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" className="h-4 w-4" {...register('tieneVenta')} />
                  En venta
                </label>
                {tieneVenta && (
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Precio de venta (COP)"
                      required
                      type="number"
                      min={0}
                      error={errors.precioVenta?.message}
                      {...register('precioVenta')}
                    />
                    <Input
                      label="Cuota de administración"
                      type="number"
                      min={0}
                      error={errors.adminVenta?.message}
                      {...register('adminVenta')}
                    />
                  </div>
                )}
              </div>

              <div className="border-border rounded-lg border p-4">
                <label className="text-text-primary flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" className="h-4 w-4" {...register('tieneArriendo')} />
                  En arriendo
                </label>
                {tieneArriendo && (
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Canon mensual (COP)"
                      required
                      type="number"
                      min={0}
                      error={errors.precioArriendo?.message}
                      {...register('precioArriendo')}
                    />
                    <Input
                      label="Cuota de administración"
                      type="number"
                      min={0}
                      error={errors.adminArriendo?.message}
                      {...register('adminArriendo')}
                    />
                    <label className="text-text-primary flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        {...register('adminIncluidaArriendo')}
                      />
                      La administración está incluida en el canon
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Características ──────────────────────────────────────────────── */}
          {caracteristicas.data && caracteristicas.data.length > 0 && (
            <section className="border-border rounded-[--radius-card] border bg-white p-5 shadow-sm">
              <h3 className="text-text-secondary text-sm font-semibold tracking-wider uppercase">
                Características
              </h3>
              <div className="mt-4 space-y-5">
                {caracteristicas.data.map((categoria) => (
                  <div key={categoria.id}>
                    <p className="text-text-primary text-sm font-medium">{categoria.nombre}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {categoria.caracteristicas.map((c) => (
                        <label
                          key={c.id}
                          className="text-text-secondary flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            value={c.id}
                            {...register('caracteristicaIds')}
                          />
                          {c.nombre}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </fieldset>

        {/* ── Sidebar: acción principal + fotos ────────────────────────────── */}
        <div className="space-y-6 xl:sticky xl:top-6">
          {errors.root && (
            <div className="text-error rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
              {errors.root.message}
            </div>
          )}

          {!yaCreado ? (
            <Button type="submit" isLoading={isPending} className="w-full">
              Crear inmueble
            </Button>
          ) : (
            <Button type="button" className="w-full" onClick={() => navigate('/admin/properties')}>
              Ir al listado
            </Button>
          )}

          <TarjetaFotos inmuebleId={inmuebleCreadoId} />
        </div>
      </form>
    </div>
  )
}

function Seccion({
  titulo,
  children,
  gridClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-2',
}: {
  titulo: string
  children: React.ReactNode
  gridClassName?: string
}) {
  return (
    <section className="border-border rounded-[--radius-card] border bg-white p-5 shadow-sm">
      <h3 className="text-text-secondary text-sm font-semibold tracking-wider uppercase">
        {titulo}
      </h3>
      <div className={`mt-4 ${gridClassName}`}>{children}</div>
    </section>
  )
}
