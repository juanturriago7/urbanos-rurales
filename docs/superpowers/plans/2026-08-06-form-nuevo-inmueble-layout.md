# Layout de ancho completo y fotos integradas en "Nuevo inmueble" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/admin/properties/nuevo` as a full-width, two-column layout (form + sticky Fotos sidebar) so photo upload feels integrated into one continuous page instead of a separate post-save screen, and is clearly optional.

**Architecture:** A new small presentational component (`TarjetaFotos`) owns the two visual states of the sidebar photo card (locked placeholder before the inmueble exists, live gallery after). `InmuebleFormPage` is restructured into a CSS grid with the form fields wrapped in a `<fieldset>` that gets disabled once the inmueble is created, replacing today's full-page swap between "form" and "gallery" screens.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS v4, React Hook Form + Zod. No test runner is configured in `FrontEndUrbanos/` (per `CLAUDE.md`) — verification uses `pnpm build` (runs `tsc -b && vite build`), `pnpm lint`, and manual checks against the running dev server instead of automated tests.

## Global Constraints

- No test runner exists in `FrontEndUrbanos/` — do not add one; verify with `pnpm build` / `pnpm lint` / manual browser check.
- Formatting: no semicolons, single quotes, trailing commas, 100-char width (Prettier, auto-applied by editor/lint — don't hand-format against this).
- Photo upload requires a real `inmuebleId` (backend route `POST /api/admin/inmuebles/{id}/imagenes/presign`) — this order cannot change, only its presentation.
- Out of scope: editing existing inmuebles (no page, no endpoint) — do not add one.
- Path alias `@/*` → `src/*`.
- Never call `apiClient` directly from a page — go through existing hooks (already the case here; no new API calls needed).

---

### Task 1: Create the `TarjetaFotos` sidebar component

**Files:**
- Create: `FrontEndUrbanos/src/features/admin/properties/components/TarjetaFotos.tsx`

**Interfaces:**
- Consumes: `GaleriaImagenes` from `@/features/admin/properties/components/GaleriaImagenes` (existing, unchanged — takes `{ inmuebleId: number }`).
- Produces: `TarjetaFotos` component, `{ inmuebleId: number | null }` props. When `inmuebleId` is `null`, renders a disabled placeholder card. When it's a number, renders `<GaleriaImagenes inmuebleId={inmuebleId} />`. Task 2 imports this from `@/features/admin/properties/components/TarjetaFotos`.

- [ ] **Step 1: Write the component**

```tsx
import { GaleriaImagenes } from '@/features/admin/properties/components/GaleriaImagenes'

interface TarjetaFotosProps {
  inmuebleId: number | null
}

/**
 * Card de fotos de la sidebar del form de inmueble. Antes de guardar el
 * registro no hay `inmuebleId` real todavía (RF-090..094 exige uno para
 * pedir la URL prefirmada), así que se muestra bloqueada; después, pasa a
 * ser la galería funcional en el mismo lugar.
 */
export function TarjetaFotos({ inmuebleId }: TarjetaFotosProps) {
  if (inmuebleId === null) {
    return (
      <section className="rounded-[--radius-card] border border-dashed border-border bg-white p-5 text-center shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Fotos <span className="font-normal normal-case">(opcional)</span>
        </h3>
        <p className="mt-3 text-xs text-text-secondary">
          Disponible después de guardar el inmueble.
        </p>
      </section>
    )
  }

  return <GaleriaImagenes inmuebleId={inmuebleId} />
}
```

- [ ] **Step 2: Type-check and build**

Run (from repo root):
```bash
cd FrontEndUrbanos && pnpm build
```
Expected: succeeds. `TarjetaFotos` isn't imported anywhere yet, so this only confirms the new file itself is valid TypeScript/JSX — it has no effect on the running app until Task 2 wires it in.

- [ ] **Step 3: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/properties/components/TarjetaFotos.tsx
git commit -m "feat(admin): agrega TarjetaFotos con estado bloqueado/activo para la sidebar del form de inmueble"
```

---

### Task 2: Restructure `InmuebleFormPage` into the two-column, full-width layout

**Files:**
- Modify: `FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx` (full rewrite of the component body and the `Seccion` helper — logic/schema/hooks stay the same, only the JSX structure and `Seccion`'s signature change)

**Interfaces:**
- Consumes: `TarjetaFotos` from Task 1 (`{ inmuebleId: number | null }`).
- Produces: same page component/route (`/admin/properties/nuevo`), no external consumers change.

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx` with:

```tsx
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

    areaConstruidaM2: numeroOpcional.refine(
      (v) => v === null || v > 0,
      'Debe ser mayor que 0',
    ),
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
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-error">
        No se pudieron cargar los catálogos. Verifica que el backend esté corriendo.
      </div>
    )
  }

  const yaCreado = inmuebleCreadoId !== null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Nuevo inmueble</h2>
          <p className="mt-1 text-sm text-text-secondary">
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
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start"
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
            gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
          <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Operaciones
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              Un inmueble puede estar en venta, en arriendo o en ambas.
            </p>

            {errors.tieneVenta?.message && (
              <p className="mt-2 text-xs text-error">{errors.tieneVenta.message}</p>
            )}

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-border p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
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

              <div className="rounded-lg border border-border p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
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
                    <label className="flex items-center gap-2 text-sm text-text-primary sm:col-span-2">
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
            <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Características
              </h3>
              <div className="mt-4 space-y-5">
                {caracteristicas.data.map((categoria) => (
                  <div key={categoria.id}>
                    <p className="text-sm font-medium text-text-primary">{categoria.nombre}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {categoria.caracteristicas.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-sm text-text-secondary"
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

          {errors.root && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
              {errors.root.message}
            </div>
          )}
        </fieldset>

        {/* ── Sidebar: acción principal + fotos ────────────────────────────── */}
        <div className="space-y-6 lg:sticky lg:top-6">
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
    <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
        {titulo}
      </h3>
      <div className={`mt-4 ${gridClassName}`}>{children}</div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check and build**

Run (from repo root):
```bash
cd FrontEndUrbanos && pnpm build
```
Expected: succeeds with no TypeScript errors (in particular: `TarjetaFotos` import resolves, `Seccion`'s new `gridClassName` prop is optional so existing call sites without it still compile, `fieldset disabled` is valid JSX).

- [ ] **Step 3: Lint**

Run (from repo root):
```bash
cd FrontEndUrbanos && pnpm lint
```
Expected: no errors. If Prettier/ESLint reformats class ordering (via `prettier-plugin-tailwindcss`), accept the formatter's output.

- [ ] **Step 4: Manual verification in the browser**

1. Start the backend (`Backend/scripts/dev-setup.ps1` if not already running) and the frontend dev server:
   ```bash
   cd FrontEndUrbanos && pnpm dev
   ```
2. Log into the admin panel and navigate to `http://localhost:5173/admin/properties/nuevo`.
3. Confirm the page now spans the full available width (no dead space on the right) and shows two columns on a wide window: form on the left, a sidebar on the right with the "Crear inmueble" button on top and a greyed-out "Fotos (opcional)" card below reading "Disponible después de guardar el inmueble."
4. Shrink the window below the `lg` breakpoint (~1024px) and confirm it collapses to a single stacked column.
5. Fill in the required fields and submit. Confirm:
   - A green banner appears: "Inmueble creado en borrador. Ya puedes subir fotos o terminar."
   - All form fields are now visibly disabled (greyed background) and unclickable.
   - The "Cancelar" button in the header is gone.
   - The sidebar button now reads "Ir al listado" and navigates to `/admin/properties` when clicked.
   - The Fotos card in the sidebar is now the live gallery (upload button enabled, "Todavía no hay fotos…" placeholder).
6. Upload a photo through the now-active gallery card and confirm it appears with a "Portada" badge on the first upload.

- [ ] **Step 5: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx
git commit -m "feat(admin): layout de dos columnas en nuevo inmueble con fotos integradas en la sidebar"
```

---

## Self-Review Notes

- **Spec coverage:** grid de dos columnas full-width (Task 2 Step 1 layout) ✓; tarjeta de Fotos opcional bloqueada/activa (Task 1 + wiring in Task 2) ✓; estado post-creación con fieldset deshabilitado, banner y botón "Ir al listado" (Task 2 Step 1) ✓; `lg:grid-cols-3` en Ficha técnica (Task 2 Step 1) ✓; fuera de alcance (edición) — no se agregó ✓.
- **Placeholder scan:** no `TBD`/`TODO`; all steps contain literal code or literal shell commands.
- **Type consistency:** `TarjetaFotos({ inmuebleId: number | null })` in Task 1 matches the call `<TarjetaFotos inmuebleId={inmuebleCreadoId} />` in Task 2, where `inmuebleCreadoId: number | null` (unchanged from the original `useState<number | null>(null)`). `Seccion`'s new `gridClassName?: string` prop defaults to the original classes, so the three unchanged call sites (`Identificación`, `Dirección y coordenadas`) keep compiling without passing it.
