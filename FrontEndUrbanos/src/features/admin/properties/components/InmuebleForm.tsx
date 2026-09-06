import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  inmuebleSchema,
  valoresPorDefecto,
  type InmuebleFormInput,
  type InmuebleFormParsed,
} from '@/features/admin/properties/schemas/inmuebleSchema'

interface InmuebleFormProps {
  /**
   * Valores iniciales del formulario. **Se leen UNA sola vez, al montar**:
   * `useForm` fija `defaultValues` en el primer render y este componente no
   * llama a `reset()`. Una página que cargue datos de forma asíncrona debe
   * entonces NO montar el formulario hasta tenerlos, o remontarlo con
   * `key={id}` — si se monta antes, los campos quedan vacíos para siempre y
   * el primer guardado borra el registro.
   */
  valoresIniciales?: Partial<InmuebleFormInput>
  onSubmit: (datos: InmuebleFormParsed) => Promise<void>
  enviando: boolean
  textoBoton: string
  /** Se renderiza en la sidebar; en creación es TarjetaFotos, en edición GaleriaImagenes. */
  panelFotos?: React.ReactNode
  /**
   * Reemplaza al botón de submit cuando la página ya no quiere que se envíe
   * el formulario. En creación, tras guardar, es el enlace "Ir al listado".
   * Va aquí y no dentro de `panelFotos` porque el submit vive fuera del
   * fieldset deshabilitado: colarlo por la prop de fotos funcionaría, pero
   * dejaría un nombre que miente sobre lo que contiene.
   *
   * El `??` que la resuelve trata `null` y `undefined` igual: con cualquiera
   * de los dos se cae al botón de submit. Pasar `null` NO suprime el submit,
   * así que un `cond ? <X/> : null` junto a `deshabilitado={false}` renderiza
   * un submit que nadie pidió; para no tener acción principal, `deshabilitado`.
   */
  accionPrincipal?: React.ReactNode
  deshabilitado?: boolean
}

/**
 * Formulario de inmueble compartido por el alta y la edición (RF-070, RF-072,
 * RF-076, RF-077). No sabe si está creando o editando: la página que lo usa
 * decide qué hace `onSubmit`, qué dice el botón y qué panel de fotos va en la
 * sidebar.
 *
 * Las reglas replican las del validador de FluentValidation del backend
 * (InmuebleDatosValidatorBase) para dar retroalimentación inmediata; el backend
 * sigue siendo la autoridad y sus mensajes se muestran si algo se escapa.
 */

export function InmuebleForm({
  valoresIniciales,
  onSubmit,
  enviando,
  textoBoton,
  panelFotos,
  accionPrincipal,
  deshabilitado = false,
}: InmuebleFormProps) {
  const tipos = useTiposInmueble()
  const ubicaciones = useUbicaciones()
  const caracteristicas = useCaracteristicas()

  // Tipo inicial resuelto ANTES de montar useForm: tipos.data ya está cargado
  // en este punto (el early return de más abajo bloquea el render mientras
  // tipos.isLoading), así que esPropiedadHorizontal arranca correcto incluso
  // en edición, sin esperar al primer cambio del select.
  const tipoInicial = tipos.data?.find(
    (t) => String(t.id) === String(valoresIniciales?.tipoInmuebleId ?? ''),
  )

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<InmuebleFormInput, unknown, InmuebleFormParsed>({
    resolver: zodResolver(inmuebleSchema),
    defaultValues: {
      ...valoresPorDefecto,
      ...valoresIniciales,
      esPropiedadHorizontal: tipoInicial?.esPropiedadHorizontal ?? false,
    },
  })

  // useWatch en vez de watch(): watch() devuelve una función no memoizable y el
  // compilador de React descarta la optimización del componente entero.
  const tieneVenta = useWatch({ control, name: 'tieneVenta' })
  const tieneArriendo = useWatch({ control, name: 'tieneArriendo' })
  const tipoInmuebleIdActual = useWatch({ control, name: 'tipoInmuebleId' })

  const tipoActual = tipos.data?.find((t) => String(t.id) === String(tipoInmuebleIdActual))
  const esPH = tipoActual?.esPropiedadHorizontal ?? false

  // Sincroniza el flag oculto que usa el schema para decidir cuál área exigir
  // (ver inmuebleSchema.ts) cada vez que el usuario cambia el tipo de inmueble.
  useEffect(() => {
    setValue('esPropiedadHorizontal', esPH)
  }, [esPH, setValue])

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

  const alEnviar = async (datos: InmuebleFormParsed) => {
    try {
      await onSubmit(datos)
    } catch (error) {
      setError('root', {
        message: mensajeDeError(error, 'No se pudo guardar el inmueble.'),
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

  return (
    <form
      onSubmit={handleSubmit(alEnviar, alFallarValidacion)}
      noValidate
      className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px] xl:items-start"
    >
      <fieldset disabled={deshabilitado} className="m-0 min-w-0 space-y-6 border-0 p-0">
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
        <Seccion titulo="Dirección y ubicación en mapa">
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
            label="URL de embed de Google Maps"
            placeholder="https://www.google.com/maps/embed?pb=..."
            wrapperClassName="sm:col-span-2"
            hint="En Google Maps: Compartir → Insertar un mapa → copia el link que empieza por https://www.google.com/maps/embed..."
            error={errors.mapaEmbedUrl?.message}
            {...register('mapaEmbedUrl')}
          />
        </Seccion>

        {/* ── Ficha técnica ────────────────────────────────────────────────── */}
        <Seccion
          titulo="Ficha técnica"
          gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {/* Spec 03 — cuál área es obligatoria depende del tipo elegido
              (esPropiedadHorizontal, ver useEffect que sincroniza el campo
              oculto homónimo del schema): PH exige área construida y no pide
              terreno; el resto (casa, lote, edificio) exige terreno. La misma
              regla se valida en el backend (InmuebleDatosValidatorBase) contra
              el catálogo tipos_inmueble — esto es solo la señal inmediata. */}
          {!esPH && (
            <Input
              label="Área de terreno (m²)"
              type="number"
              step="0.01"
              required
              placeholder="0"
              hint="Obligatoria para este tipo de inmueble."
              error={errors.areaTerrenoM2?.message}
              {...register('areaTerrenoM2')}
            />
          )}
          <Input
            label="Área construida (m²)"
            type="number"
            step="0.01"
            required={esPH}
            hint={esPH ? 'Obligatoria para este tipo de inmueble.' : undefined}
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
            label="Link de YouTube (recorrido virtual)"
            placeholder="https://www.youtube.com/watch?v=..."
            wrapperClassName="sm:col-span-2"
            error={errors.youtubeUrl?.message}
            {...register('youtubeUrl')}
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
                    {categoria.caracteristicas.map((c) =>
                      c.tipoValor === 'booleano' ? (
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
                      ) : (
                        // Características de número/texto: input en vez de checkbox.
                        // La sola presencia de un valor no vacío la marca como
                        // asociada al inmueble (ver aDatosInput). Vacío = no la tiene.
                        <label
                          key={c.id}
                          className="text-text-secondary flex flex-col gap-1 text-sm"
                        >
                          <span>
                            {c.nombre}{' '}
                            <span className="text-text-secondary/60">({c.tipoValor})</span>
                          </span>
                          <input
                            type={c.tipoValor === 'numero' ? 'number' : 'text'}
                            inputMode={c.tipoValor === 'numero' ? 'decimal' : undefined}
                            className="border-border focus:border-b-brand-600 rounded-control border px-2 py-1 text-sm focus:border-b-2 focus:outline-none"
                            {...register(`caracteristicaTextos.${c.id}`)}
                          />
                        </label>
                      ),
                    )}
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

        {accionPrincipal ??
          (!deshabilitado && (
            <Button type="submit" isLoading={enviando} className="w-full">
              {textoBoton}
            </Button>
          ))}

        {panelFotos}
      </div>
    </form>
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
