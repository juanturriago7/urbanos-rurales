# Pantalla de edición de inmuebles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir editar un inmueble ya creado desde el admin —campos, operaciones y fotos— mediante una ruta `/admin/properties/:id/editar`.

**Architecture:** Trabajo exclusivamente de frontend; el backend ya expone `GET /{id}`, `PUT /{id}` y `PUT /{id}/operaciones`. El formulario de 625 líneas de `InmuebleFormPage` se descompone en tres piezas: un schema Zod puro (`schemas/inmuebleSchema.ts`), mapeadores puros DTO↔formulario (`schemas/inmuebleMappers.ts`) y un componente de formulario reutilizable (`components/InmuebleForm.tsx`). Las páginas de crear y editar quedan como envolturas delgadas que solo deciden cómo persistir.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, React Hook Form, Zod 4, Tailwind v4, Vitest (nuevo), pnpm.

## Global Constraints

- Formato Prettier del repo: **sin punto y coma**, comillas simples, comas finales, ancho 100.
- Idioma del dominio: **español** en nombres de archivos, funciones, tipos y comentarios.
- Path alias `@/*` → `src/*`. Usarlo siempre; nada de rutas relativas largas.
- Nunca llamar `apiClient` desde un componente: siempre `api/*.ts` → `hooks/use*.ts` → página.
- `PUT /api/admin/inmuebles/{id}/operaciones` recibe **UNA** operación por llamada, no un arreglo.
- No existe endpoint de borrado de operación: se desactiva con `activo: false` **reenviando el precio existente** (el validador del backend exige `Precio > 0` siempre).
- Los diffs en `app/router/index.tsx` deben ser **puramente aditivos** (una línea nueva, sin reordenar).
- No tocar `components/GaleriaImagenes.tsx`, `components/TarjetaFotos.tsx`, `hooks/useImagenes.ts` ni nada del backend.
- Tests en entorno **node**, sin DOM: solo se testea lo puro (schema, mapeadores, funciones de API con `apiClient` mockeado).

---

### Task 1: Montar Vitest

**Files:**
- Modify: `FrontEndUrbanos/package.json`
- Modify: `FrontEndUrbanos/vite.config.ts`
- Test: `FrontEndUrbanos/src/shared/lib/smoke.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: comando `pnpm test` (una pasada, no watch) y `pnpm test:watch`. Todas las tareas siguientes dependen de esto.

- [ ] **Step 1: Instalar Vitest**

Desde `FrontEndUrbanos/`:

```bash
pnpm add -D vitest@^4
```

**Tiene que ser vitest 4, no 3.** Este proyecto usa `vite@^8.1.1`, y el rango de peers de vitest 3 llega solo hasta vite 7: pnpm instala entonces un `vite@7` en paralelo al `vite@8` del proyecto, y los tipos de ambos chocan en `vite.config.ts` (`error TS2769: No overload matches this call` sobre `plugins`), rompiendo `pnpm build` aunque los tests pasen. vitest 4 declara `vite: ^6.0.0 || ^7.0.0 || ^8.0.0` y reutiliza el vite que ya está.

No se instala `jsdom`, `happy-dom` ni Testing Library: los tests corren en entorno `node`.

- [ ] **Step 2: Configurar Vitest en vite.config.ts**

Cambiar el import de `defineConfig` para que venga de `vitest/config` (así el bloque `test` queda tipado) y añadir el bloque `test`. El archivo completo queda:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Sin DOM a propósito: solo se testea lógica pura (schema, mapeadores y
    // funciones de API con apiClient mockeado). Ver el spec.
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
  server: {
    port: 5173,
    // Respaldo para cuando VITE_API_BASE_URL se deja vacío y las peticiones
    // salen relativas. El destino es el puerto del perfil `http` de la API
    // (`dotnet run`); si levantas el backend con docker compose, es el 8080.
    proxy: {
      '/api': {
        target: 'http://localhost:5095',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Agregar los scripts a package.json**

En el bloque `"scripts"`, junto a los existentes:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Escribir un smoke test**

Crear `src/shared/lib/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('infraestructura de tests', () => {
  it('corre y resuelve el alias @', async () => {
    const modulo = await import('@/shared/lib/axios')
    expect(modulo.apiClient).toBeDefined()
  })
})
```

Este test vale por sí solo: si el alias `@` no estuviera resuelto en Vitest, todos los tests de las tareas siguientes fallarían con un error de import críptico.

- [ ] **Step 5: Correr el test Y el build**

Run: `pnpm test`
Expected: PASS, 1 test.

Run: `pnpm build`
Expected: exit 0, sin errores de TypeScript. **Este paso no es opcional**: es el único que detecta un conflicto de versiones entre vitest y vite, que se manifiesta solo en `tsc` y deja los tests pasando en verde.

- [ ] **Step 6: Commit**

```bash
git add FrontEndUrbanos/package.json FrontEndUrbanos/pnpm-lock.yaml FrontEndUrbanos/vite.config.ts FrontEndUrbanos/src/shared/lib/smoke.test.ts
git commit -m "chore(test): monta Vitest en entorno node, sin DOM"
```

---

### Task 2: Extraer el schema Zod y arreglar el bug de Zod 4

**Files:**
- Create: `FrontEndUrbanos/src/features/admin/properties/schemas/inmuebleSchema.ts`
- Modify: `FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx:30-132` (borrar el schema, importarlo)
- Test: `FrontEndUrbanos/src/features/admin/properties/schemas/inmuebleSchema.test.ts`

**Interfaces:**
- Consumes: `pnpm test` de la Task 1.
- Produces:
  - `inmuebleSchema` — el objeto Zod.
  - `type InmuebleFormInput = z.input<typeof inmuebleSchema>`
  - `type InmuebleFormParsed = z.output<typeof inmuebleSchema>`
  - `valoresPorDefecto: Partial<InmuebleFormInput>` — los `defaultValues` de creación.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/features/admin/properties/schemas/inmuebleSchema.test.ts`. Los tres primeros tests son los que capturan el bug de Zod 4 (pendiente #1 de la bitácora): cuando el checkbox de una operación está desmarcado, sus campos de precio nunca se registran y **la clave llega ausente**, no como `undefined` explícito.

```ts
import { describe, expect, it } from 'vitest'
import { inmuebleSchema } from '@/features/admin/properties/schemas/inmuebleSchema'

/** Base válida mínima, sin ninguna clave de precio ni de área. */
const base = {
  titulo: 'Casa en Chía',
  tipoInmuebleId: 1,
  ubicacionId: 2,
  direccionExacta: 'Calle 1 # 2-3',
  habitaciones: 3,
  banos: 2,
  parqueaderos: 1,
  politicaMascotas: 'permitidas',
  amoblado: 'no',
  tieneVenta: true,
  precioVenta: 150000000,
  tieneArriendo: false,
  adminIncluidaArriendo: false,
  caracteristicaIds: [],
}

describe('inmuebleSchema — operaciones', () => {
  it('acepta solo venta, con las claves de arriendo ausentes', () => {
    const r = inmuebleSchema.safeParse(base)
    expect(r.success).toBe(true)
  })

  it('acepta solo arriendo, con las claves de venta ausentes', () => {
    // La clave se OMITE, no se pone en undefined: en Zod 4 son rutas
    // distintas. Sin `.optional()`, una clave ausente se rechaza pero un
    // `undefined` explícito se acepta — escribir `precioVenta: undefined`
    // haría que este test pase con o sin el arreglo, que es justo lo que
    // no queremos.
    const { precioVenta: _omitido, ...sinVenta } = base
    const r = inmuebleSchema.safeParse({
      ...sinVenta,
      tieneVenta: false,
      tieneArriendo: true,
      precioArriendo: 2500000,
    })
    expect(r.success).toBe(true)
  })

  it('acepta que las claves de área opcionales estén ausentes', () => {
    const r = inmuebleSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.areaTerrenoM2).toBeNull()
      expect(r.data.areaConstruidaM2).toBeNull()
    }
  })

  it('rechaza cero operaciones', () => {
    const r = inmuebleSchema.safeParse({ ...base, tieneVenta: false, tieneArriendo: false })
    expect(r.success).toBe(false)
  })

  it('exige precio de venta cuando la venta está activa', () => {
    const r = inmuebleSchema.safeParse({ ...base, precioVenta: 0 })
    expect(r.success).toBe(false)
  })

  it('exige canon cuando el arriendo está activo', () => {
    const r = inmuebleSchema.safeParse({ ...base, tieneArriendo: true })
    expect(r.success).toBe(false)
  })
})

describe('inmuebleSchema — normalización', () => {
  it('convierte los strings de los <input type="number"> a número', () => {
    const r = inmuebleSchema.safeParse({ ...base, habitaciones: '4', estrato: '3' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.habitaciones).toBe(4)
      expect(r.data.estrato).toBe(3)
    }
  })

  it('convierte string vacío a null en los campos opcionales', () => {
    const r = inmuebleSchema.safeParse({ ...base, antiguedad: '   ', areaPrivadaM2: '' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.antiguedad).toBeNull()
      expect(r.data.areaPrivadaM2).toBeNull()
    }
  })

  it('rechaza estrato fuera de 1..6', () => {
    expect(inmuebleSchema.safeParse({ ...base, estrato: 9 }).success).toBe(false)
  })

  it('rechaza una URL de video que no sea de YouTube', () => {
    expect(inmuebleSchema.safeParse({ ...base, youtubeUrl: 'https://vimeo.com/1' }).success).toBe(
      false,
    )
  })

  it('normaliza los ids de característica que llegan como string del DOM', () => {
    const r = inmuebleSchema.safeParse({ ...base, caracteristicaIds: ['3', '7'] })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.caracteristicaIds).toEqual([3, 7])
  })
})
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `pnpm test inmuebleSchema`
Expected: FAIL — el módulo `@/features/admin/properties/schemas/inmuebleSchema` todavía no existe.

- [ ] **Step 3: Crear el archivo del schema**

Crear `src/features/admin/properties/schemas/inmuebleSchema.ts`. Es un **movimiento** de `InmuebleFormPage.tsx:30-132` con **un solo cambio de comportamiento**: `.optional()` sobre los **dos** helpers opcionales (`numeroOpcional` y `textoOpcional`), que es el arreglo del bug de Zod 4.

`numeroRequerido` **no** lleva `.optional()`: respalda campos que siempre están registrados en pantalla (`tipoInmuebleId`, `ubicacionId`, `habitaciones`, `banos`, `parqueaderos`), nunca campos ocultos tras un checkbox, así que su clave jamás llega ausente.

```ts
import { z } from 'zod'

/**
 * Schema del formulario de inmueble, compartido por creación y edición.
 *
 * Vive en archivo propio y sin dependencias de React para poder ejercitarlo en
 * Vitest sin entorno DOM. Las reglas replican las del validador de
 * FluentValidation del backend (InmuebleDatosValidatorBase) para dar
 * retroalimentación inmediata; el backend sigue siendo la autoridad.
 */

// Los <input type="number"> entregan string; se convierten antes de validar.
//
// El `.optional()` es imprescindible y su ausencia era un bug: los campos de una
// operación solo se renderizan cuando su checkbox está marcado, así que mientras
// estén ocultos nunca se registran y su clave llega AUSENTE del objeto. En Zod 4
// un union que incluye z.undefined() ya no marca la clave como opcional, así que
// sin .optional() la validación fallaba en un campo que no está en pantalla y el
// submit se abortaba sin mostrar ningún error.
const numeroOpcional = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .optional()
  .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))

const numeroRequerido = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)))

const textoOpcional = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))

export const inmuebleSchema = z
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

    // Spec 03 — lat/long eliminados; el mapa ahora es un embed de Google Maps.
    areaTerrenoM2: numeroOpcional.refine((v) => v === null || v > 0, 'Debe ser mayor que 0'),
    areaConstruidaM2: numeroOpcional.refine((v) => v === null || v > 0, 'Debe ser mayor que 0'),
    areaPrivadaM2: numeroOpcional.refine((v) => v === null || v > 0, 'Debe ser mayor que 0'),

    youtubeUrl: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || v.includes('youtube.com') || v.includes('youtu.be'),
        'El link debe ser una URL de YouTube.',
      ),
    mapaEmbedUrl: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || v.startsWith('https://www.google.com/maps/embed'),
        'Debe ser una URL de embed de Google Maps (https://www.google.com/maps/embed...).',
      ),

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

export type InmuebleFormInput = z.input<typeof inmuebleSchema>
export type InmuebleFormParsed = z.output<typeof inmuebleSchema>

/** defaultValues de React Hook Form para el alta de un inmueble nuevo. */
export const valoresPorDefecto: Partial<InmuebleFormInput> = {
  politicaMascotas: 'no_permitidas',
  amoblado: 'no',
  habitaciones: 0,
  banos: 0,
  parqueaderos: 0,
  tieneVenta: true,
  tieneArriendo: false,
  adminIncluidaArriendo: false,
  caracteristicaIds: [],
}
```

- [ ] **Step 4: Correr los tests**

Run: `pnpm test inmuebleSchema`
Expected: PASS, 11 tests.

> **Si algún test de "claves ausentes" pasa incluso antes del `.optional()`**, no lo des por bueno: significa que el bug se manifiesta por otra vía. Detente y reporta antes de seguir; no ajustes el test para que cuadre.

- [ ] **Step 5: Hacer que InmuebleFormPage use el schema importado**

En `InmuebleFormPage.tsx`: borrar las líneas 30-132 (los tres helpers, `inmuebleSchema`, y los `type InmuebleForm` / `InmuebleFormParsed`), y añadir el import:

```ts
import {
  inmuebleSchema,
  valoresPorDefecto,
  type InmuebleFormInput,
  type InmuebleFormParsed,
} from '@/features/admin/properties/schemas/inmuebleSchema'
```

Renombrar los usos del tipo local `InmuebleForm` a `InmuebleFormInput` (en `useForm<InmuebleForm, unknown, InmuebleFormParsed>` → `useForm<InmuebleFormInput, unknown, InmuebleFormParsed>`), y reemplazar el objeto literal de `defaultValues` por `valoresPorDefecto`. Quitar el import de `zod` si queda sin uso.

- [ ] **Step 6: Verificar que compila y que nada se rompió**

Run: `pnpm build && pnpm test`
Expected: build sin errores de TypeScript; todos los tests PASS.

- [ ] **Step 7: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/properties/schemas/ FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx
git commit -m "fix(inmuebles): extrae el schema Zod y corrige el bug de opcionalidad de Zod 4"
```

---

### Task 3: Mapeadores puros DTO ↔ formulario

**Files:**
- Create: `FrontEndUrbanos/src/features/admin/properties/schemas/inmuebleMappers.ts`
- Test: `FrontEndUrbanos/src/features/admin/properties/schemas/inmuebleMappers.test.ts`

**Interfaces:**
- Consumes: `InmuebleFormInput`, `InmuebleFormParsed` de la Task 2; los tipos `InmuebleDatosInput`, `OperacionInput` de `api/inmueblesApi.ts`.
- Produces:
  - `api/inmueblesTypes.ts` con: las uniones `EstadoInmueble`, `TipoOperacion`, `PoliticaMascotas`, `Amoblado` (**movidas** desde `inmueblesApi.ts:9-12`), más `OperacionDto`, `CaracteristicaValorDto`, `ImagenDto`, `InmuebleAdminDetalleDto`, `UpsertOperacionInput`.
  - `aValoresFormulario(dto: InmuebleAdminDetalleDto): InmuebleFormInput`
  - `aDatosInput(datos: InmuebleFormParsed): InmuebleDatosInput`
  - `aOperacionesUpsert(datos: InmuebleFormParsed, actuales: OperacionDto[]): UpsertOperacionInput[]`

Esta tarea concentra toda la lógica con riesgo real de bug, y es 100% testeable sin DOM.

Los tipos del detalle admin (`InmuebleAdminDetalleDto`, `OperacionDto`, `UpsertOperacionInput`) los necesitan tanto esta tarea como la Task 4. Van en un **archivo propio de tipos** (`api/inmueblesTypes.ts`), creado en el paso 1 de aquí: si vivieran en `inmuebleMappers.ts`, la Task 4 tendría que importar tipos desde la capa de schemas, y si vivieran en `inmueblesApi.ts`, los mapeadores importarían de la capa de API. El archivo aparte deja a ambas capas dependiendo solo de tipos.

- [ ] **Step 1: Crear los tipos que faltan**

Crear `src/features/admin/properties/api/inmueblesTypes.ts`.

**Las uniones primitivas se MUEVEN aquí desde `inmueblesApi.ts`** (líneas 9-12 de ese archivo). Es imprescindible: si `inmueblesTypes.ts` las importara de `inmueblesApi.ts` mientras `inmueblesApi.ts` importa los DTOs de `inmueblesTypes.ts`, quedaría un ciclo de imports. Con `import type` TypeScript lo borraría en compilación, pero es exactamente el acoplamiento que este archivo existe para evitar. La dependencia va en una sola dirección: `inmueblesApi.ts` → `inmueblesTypes.ts`.

```ts
export type EstadoInmueble = 'borrador' | 'publicado' | 'pausado' | 'archivado'
export type TipoOperacion = 'venta' | 'arriendo'
export type PoliticaMascotas = 'permitidas' | 'no_permitidas' | 'con_restricciones'
export type Amoblado = 'si' | 'no' | 'semi'

export interface OperacionDto {
  id: number
  tipoOperacion: TipoOperacion
  precio: number
  cuotaAdministracion: number | null
  adminIncluida: boolean
  estado: string
  activo: boolean
}

export interface CaracteristicaValorDto {
  caracteristicaId: number
  nombre: string
  categoria: string
  valor: string | null
}

export interface ImagenDto {
  id: number
  url: string
  esPortada: boolean
  orden: number
}

/** Respuesta de GET /api/admin/inmuebles/{id}. */
export interface InmuebleAdminDetalleDto {
  id: number
  codigoReferencia: string
  slug: string
  titulo: string
  descripcion: string | null
  tipoInmuebleId: number
  ubicacionId: number
  direccionExacta: string
  areaTerrenoM2: number | null
  areaConstruidaM2: number | null
  areaPrivadaM2: number | null
  youtubeUrl: string | null
  mapaEmbedUrl: string | null
  habitaciones: number
  banos: number
  parqueaderos: number
  piso: number | null
  pisosEdificio: number | null
  estrato: number | null
  antiguedad: string | null
  orientacion: string | null
  politicaMascotas: PoliticaMascotas
  amoblado: Amoblado | null
  matriculaInmobiliaria: string | null
  estado: EstadoInmueble
  destacado: boolean
  metaTitulo: string | null
  metaDescripcion: string | null
  asesorId: number | null
  creadoEn: string
  actualizadoEn: string
  operaciones: OperacionDto[]
  caracteristicas: CaracteristicaValorDto[]
  imagenes: ImagenDto[]
}

/** Body de PUT /api/admin/inmuebles/{id}/operaciones — UNA operación por llamada. */
export interface UpsertOperacionInput {
  tipoOperacion: TipoOperacion
  precio: number
  cuotaAdministracion?: number | null
  adminIncluida: boolean
  estado?: string | null
  activo?: boolean | null
}
```

- [ ] **Step 2: Escribir los tests que fallan**

Crear `src/features/admin/properties/schemas/inmuebleMappers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  aDatosInput,
  aOperacionesUpsert,
  aValoresFormulario,
} from '@/features/admin/properties/schemas/inmuebleMappers'
import { inmuebleSchema } from '@/features/admin/properties/schemas/inmuebleSchema'
import type {
  InmuebleAdminDetalleDto,
  OperacionDto,
} from '@/features/admin/properties/api/inmueblesTypes'

const opVenta: OperacionDto = {
  id: 10,
  tipoOperacion: 'venta',
  precio: 150000000,
  cuotaAdministracion: null,
  adminIncluida: false,
  estado: 'disponible',
  activo: true,
}

const opArriendo: OperacionDto = {
  id: 11,
  tipoOperacion: 'arriendo',
  precio: 2500000,
  cuotaAdministracion: 300000,
  adminIncluida: true,
  estado: 'disponible',
  activo: true,
}

const dto: InmuebleAdminDetalleDto = {
  id: 7,
  codigoReferencia: 'INM-007',
  slug: 'casa-chia',
  titulo: 'Casa en Chía',
  descripcion: null,
  tipoInmuebleId: 1,
  ubicacionId: 2,
  direccionExacta: 'Calle 1 # 2-3',
  areaTerrenoM2: 300,
  areaConstruidaM2: 180,
  areaPrivadaM2: null,
  youtubeUrl: null,
  mapaEmbedUrl: null,
  habitaciones: 3,
  banos: 2,
  parqueaderos: 1,
  piso: null,
  pisosEdificio: null,
  estrato: 4,
  antiguedad: null,
  orientacion: null,
  politicaMascotas: 'permitidas',
  amoblado: 'no',
  matriculaInmobiliaria: null,
  estado: 'borrador',
  destacado: false,
  metaTitulo: null,
  metaDescripcion: null,
  asesorId: null,
  creadoEn: '2026-08-01T00:00:00Z',
  actualizadoEn: '2026-08-02T00:00:00Z',
  operaciones: [opVenta],
  caracteristicas: [
    { caracteristicaId: 3, nombre: 'Piscina', categoria: 'Exteriores', valor: null },
    { caracteristicaId: 7, nombre: 'Gimnasio', categoria: 'Comunes', valor: null },
  ],
  imagenes: [],
}

describe('aValoresFormulario', () => {
  it('produce valores que el schema acepta', () => {
    expect(inmuebleSchema.safeParse(aValoresFormulario(dto)).success).toBe(true)
  })

  it('marca las operaciones activas y copia sus precios', () => {
    const v = aValoresFormulario({ ...dto, operaciones: [opVenta, opArriendo] })
    expect(v.tieneVenta).toBe(true)
    expect(v.precioVenta).toBe(150000000)
    expect(v.tieneArriendo).toBe(true)
    expect(v.precioArriendo).toBe(2500000)
    expect(v.adminArriendo).toBe(300000)
    expect(v.adminIncluidaArriendo).toBe(true)
  })

  it('trata una operación inactiva como desmarcada', () => {
    const v = aValoresFormulario({ ...dto, operaciones: [{ ...opVenta, activo: false }] })
    expect(v.tieneVenta).toBe(false)
  })

  it('aplana las características a sus ids', () => {
    expect(aValoresFormulario(dto).caracteristicaIds).toEqual([3, 7])
  })
})

describe('aDatosInput', () => {
  it('no incluye claves de operación en el payload de campos', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dto))
    const payload = aDatosInput(datos) as Record<string, unknown>
    expect(payload).not.toHaveProperty('tieneVenta')
    expect(payload).not.toHaveProperty('precioVenta')
    expect(payload.titulo).toBe('Casa en Chía')
  })

  it('convierte los ids de característica al shape que espera el backend', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dto))
    expect(aDatosInput(datos).caracteristicas).toEqual([
      { caracteristicaId: 3 },
      { caracteristicaId: 7 },
    ])
  })
})

describe('aOperacionesUpsert', () => {
  it('envía la operación marcada como activa', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dto))
    const ops = aOperacionesUpsert(datos, [opVenta])
    expect(ops).toEqual([
      {
        tipoOperacion: 'venta',
        precio: 150000000,
        cuotaAdministracion: null,
        adminIncluida: false,
        activo: true,
      },
    ])
  })

  it('desactiva una operación desmarcada reenviando su precio anterior', () => {
    // El validador del backend exige Precio > 0 incluso al desactivar.
    const datos = inmuebleSchema.parse({
      ...aValoresFormulario({ ...dto, operaciones: [opVenta, opArriendo] }),
      tieneArriendo: false,
    })
    const ops = aOperacionesUpsert(datos, [opVenta, opArriendo])
    const arriendo = ops.find((o) => o.tipoOperacion === 'arriendo')
    expect(arriendo).toBeDefined()
    expect(arriendo!.activo).toBe(false)
    expect(arriendo!.precio).toBe(2500000)
  })

  it('no envía nada para una operación que nunca existió y sigue desmarcada', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dto))
    const ops = aOperacionesUpsert(datos, [opVenta])
    expect(ops.some((o) => o.tipoOperacion === 'arriendo')).toBe(false)
  })
})
```

- [ ] **Step 3: Correr los tests para verificar que fallan**

Run: `pnpm test inmuebleMappers`
Expected: FAIL — el módulo `inmuebleMappers` no existe.

- [ ] **Step 4: Implementar los mapeadores**

Crear `src/features/admin/properties/schemas/inmuebleMappers.ts`:

```ts
import type {
  CaracteristicaValorInput,
  InmuebleDatosInput,
} from '@/features/admin/properties/api/inmueblesApi'
import type {
  InmuebleAdminDetalleDto,
  OperacionDto,
  UpsertOperacionInput,
} from '@/features/admin/properties/api/inmueblesTypes'
import type {
  InmuebleFormInput,
  InmuebleFormParsed,
} from '@/features/admin/properties/schemas/inmuebleSchema'

/** Detalle del backend → valores iniciales de React Hook Form. */
export function aValoresFormulario(dto: InmuebleAdminDetalleDto): InmuebleFormInput {
  const venta = dto.operaciones.find((o) => o.tipoOperacion === 'venta' && o.activo)
  const arriendo = dto.operaciones.find((o) => o.tipoOperacion === 'arriendo' && o.activo)

  return {
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    tipoInmuebleId: dto.tipoInmuebleId,
    ubicacionId: dto.ubicacionId,
    direccionExacta: dto.direccionExacta,
    areaTerrenoM2: dto.areaTerrenoM2,
    areaConstruidaM2: dto.areaConstruidaM2,
    areaPrivadaM2: dto.areaPrivadaM2,
    youtubeUrl: dto.youtubeUrl ?? undefined,
    mapaEmbedUrl: dto.mapaEmbedUrl ?? undefined,
    habitaciones: dto.habitaciones,
    banos: dto.banos,
    parqueaderos: dto.parqueaderos,
    piso: dto.piso,
    pisosEdificio: dto.pisosEdificio,
    estrato: dto.estrato,
    antiguedad: dto.antiguedad,
    orientacion: dto.orientacion,
    politicaMascotas: dto.politicaMascotas,
    amoblado: dto.amoblado ?? 'no',
    matriculaInmobiliaria: dto.matriculaInmobiliaria,
    tieneVenta: Boolean(venta),
    precioVenta: venta?.precio ?? undefined,
    adminVenta: venta?.cuotaAdministracion ?? undefined,
    tieneArriendo: Boolean(arriendo),
    precioArriendo: arriendo?.precio ?? undefined,
    adminArriendo: arriendo?.cuotaAdministracion ?? undefined,
    adminIncluidaArriendo: arriendo?.adminIncluida ?? false,
    caracteristicaIds: dto.caracteristicas.map((c) => c.caracteristicaId),
  }
}

/** Formulario validado → body de PUT/POST de los campos del inmueble. */
export function aDatosInput(datos: InmuebleFormParsed): InmuebleDatosInput {
  const caracteristicas: CaracteristicaValorInput[] = datos.caracteristicaIds.map((id) => ({
    caracteristicaId: id,
  }))

  return {
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    tipoInmuebleId: datos.tipoInmuebleId,
    ubicacionId: datos.ubicacionId,
    direccionExacta: datos.direccionExacta,
    areaTerrenoM2: datos.areaTerrenoM2,
    areaConstruidaM2: datos.areaConstruidaM2,
    areaPrivadaM2: datos.areaPrivadaM2,
    youtubeUrl: datos.youtubeUrl,
    mapaEmbedUrl: datos.mapaEmbedUrl,
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
    caracteristicas,
  }
}

/**
 * Formulario validado + operaciones actuales → llamadas de upsert a emitir.
 *
 * El backend recibe UNA operación por llamada y no expone borrado: una
 * operación que el usuario desmarcó se desactiva con `activo: false`,
 * reenviando el precio que ya tenía porque el validador exige Precio > 0.
 * Una operación que nunca existió y sigue desmarcada simplemente no se envía.
 */
export function aOperacionesUpsert(
  datos: InmuebleFormParsed,
  actuales: OperacionDto[],
): UpsertOperacionInput[] {
  const salida: UpsertOperacionInput[] = []

  const agregar = (
    tipo: 'venta' | 'arriendo',
    marcada: boolean,
    precio: number | null,
    cuota: number | null,
    adminIncluida: boolean,
  ) => {
    const previa = actuales.find((o) => o.tipoOperacion === tipo)

    if (marcada) {
      salida.push({
        tipoOperacion: tipo,
        precio: precio!,
        cuotaAdministracion: cuota,
        adminIncluida,
        activo: true,
      })
      return
    }

    // Desmarcada: solo hay que desactivarla si existía y estaba activa.
    if (previa?.activo) {
      salida.push({
        tipoOperacion: tipo,
        precio: previa.precio,
        cuotaAdministracion: previa.cuotaAdministracion,
        adminIncluida: previa.adminIncluida,
        activo: false,
      })
    }
  }

  agregar('venta', datos.tieneVenta, datos.precioVenta, datos.adminVenta, false)
  agregar(
    'arriendo',
    datos.tieneArriendo,
    datos.precioArriendo,
    datos.adminArriendo,
    datos.adminIncluidaArriendo,
  )

  return salida
}
```

- [ ] **Step 5: Correr los tests**

Run: `pnpm test inmuebleMappers`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/properties/api/inmueblesTypes.ts FrontEndUrbanos/src/features/admin/properties/schemas/inmuebleMappers.ts FrontEndUrbanos/src/features/admin/properties/schemas/inmuebleMappers.test.ts
git commit -m "feat(inmuebles): mapeadores puros entre el detalle admin y el formulario"
```

---

### Task 4: Funciones de API y hooks de edición

**Files:**
- Modify: `FrontEndUrbanos/src/features/admin/properties/api/inmueblesApi.ts`
- Modify: `FrontEndUrbanos/src/features/admin/properties/hooks/useInmuebles.ts`
- Test: `FrontEndUrbanos/src/features/admin/properties/api/inmueblesApi.test.ts`

**Interfaces:**
- Consumes: `InmuebleAdminDetalleDto`, `UpsertOperacionInput` de `api/inmueblesTypes.ts` (Task 3); `InmuebleDatosInput` ya existente.
- Produces:
  - `getInmuebleAdmin(id: number): Promise<InmuebleAdminDetalleDto>`
  - `actualizarInmueble(id: number, input: InmuebleDatosInput): Promise<void>`
  - `upsertOperacion(id: number, op: UpsertOperacionInput): Promise<void>`
  - `inmueblesQueryKeys.detalle(id: number)`
  - hooks `useInmueble(id)`, `useActualizarInmueble()`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/features/admin/properties/api/inmueblesApi.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const { apiClient } = await import('@/shared/lib/axios')
const { actualizarInmueble, getInmuebleAdmin, upsertOperacion } = await import(
  '@/features/admin/properties/api/inmueblesApi'
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getInmuebleAdmin', () => {
  it('pega al detalle admin del id y devuelve el cuerpo', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 7, titulo: 'Casa' } })

    const dto = await getInmuebleAdmin(7)

    expect(apiClient.get).toHaveBeenCalledWith('/api/admin/inmuebles/7')
    expect(dto.id).toBe(7)
  })
})

describe('actualizarInmueble', () => {
  it('hace PUT al recurso del id con el payload de campos', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: undefined })
    const input = { titulo: 'Casa nueva' } as never

    await actualizarInmueble(7, input)

    expect(apiClient.put).toHaveBeenCalledWith('/api/admin/inmuebles/7', input)
  })
})

describe('upsertOperacion', () => {
  it('hace PUT a la subruta de operaciones con UNA operación', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: undefined })
    const op = {
      tipoOperacion: 'venta' as const,
      precio: 1000,
      cuotaAdministracion: null,
      adminIncluida: false,
      activo: true,
    }

    await upsertOperacion(7, op)

    expect(apiClient.put).toHaveBeenCalledWith('/api/admin/inmuebles/7/operaciones', op)
  })
})
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `pnpm test inmueblesApi`
Expected: FAIL — `getInmuebleAdmin`, `actualizarInmueble` y `upsertOperacion` no están exportadas.

- [ ] **Step 3: Agregar las funciones de API**

En `api/inmueblesApi.ts`, primero **borrar las líneas 9-12** (las cuatro uniones primitivas, que se movieron a `inmueblesTypes.ts` en la Task 3) y re-exportarlas desde su nuevo hogar junto con los DTOs, para que ningún consumidor existente se rompa:

```ts
export type {
  Amoblado,
  CaracteristicaValorDto,
  EstadoInmueble,
  ImagenDto,
  InmuebleAdminDetalleDto,
  OperacionDto,
  PoliticaMascotas,
  TipoOperacion,
  UpsertOperacionInput,
} from '@/features/admin/properties/api/inmueblesTypes'
```

Las interfaces que ya usan esas uniones dentro de este archivo (`InmuebleAdminListItemDto`, `OperacionInput`, `InmuebleDatosInput`) necesitan además el import de valor de tipo:

```ts
import type {
  Amoblado,
  EstadoInmueble,
  InmuebleAdminDetalleDto,
  PoliticaMascotas,
  TipoOperacion,
  UpsertOperacionInput,
} from '@/features/admin/properties/api/inmueblesTypes'
```

Después, al final del archivo, las tres funciones nuevas:

```ts
/** Detalle completo para edición (RF-044). */
export const getInmuebleAdmin = async (id: number): Promise<InmuebleAdminDetalleDto> => {
  const { data } = await apiClient.get<InmuebleAdminDetalleDto>(`/api/admin/inmuebles/${id}`)
  return data
}

/** Edita los campos del inmueble (RF-072). Slug y código no cambian. */
export const actualizarInmueble = async (
  id: number,
  input: InmuebleDatosInput,
): Promise<void> => {
  await apiClient.put(`/api/admin/inmuebles/${id}`, input)
}

/**
 * Crea o actualiza UNA operación (RF-076). Para venta y arriendo hay que
 * llamar dos veces; el endpoint no acepta arreglos.
 */
export const upsertOperacion = async (
  id: number,
  operacion: UpsertOperacionInput,
): Promise<void> => {
  await apiClient.put(`/api/admin/inmuebles/${id}/operaciones`, operacion)
}
```

- [ ] **Step 4: Correr los tests**

Run: `pnpm test inmueblesApi`
Expected: PASS, 3 tests.

- [ ] **Step 5: Agregar los hooks**

En `hooks/useInmuebles.ts`, extender la fábrica de claves y añadir los dos hooks. La mutación de actualización orquesta las llamadas en secuencia: primero los campos, después una llamada por operación.

```ts
export const inmueblesQueryKeys = {
  all: ['inmuebles'] as const,
  list: (filtro: FiltroInmueblesAdmin) => ['inmuebles', 'list', filtro] as const,
  detalle: (id: number) => ['inmuebles', 'detalle', id] as const,
}

export function useInmueble(id: number | undefined) {
  return useQuery({
    queryKey: inmueblesQueryKeys.detalle(id ?? 0),
    queryFn: () => getInmuebleAdmin(id!),
    enabled: typeof id === 'number' && Number.isFinite(id) && id > 0,
  })
}

export function useActualizarInmueble() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      datos,
      operaciones,
    }: {
      id: number
      datos: InmuebleDatosInput
      operaciones: UpsertOperacionInput[]
    }) => {
      // Secuencial a propósito: si los campos fallan, no se tocan las
      // operaciones y el registro no queda a medias.
      await actualizarInmueble(id, datos)
      for (const operacion of operaciones) {
        await upsertOperacion(id, operacion)
      }
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: inmueblesQueryKeys.detalle(id) })
    },
  })
}
```

Añadir a los imports del archivo: `actualizarInmueble`, `getInmuebleAdmin`, `upsertOperacion`, y los tipos `InmuebleDatosInput` y `UpsertOperacionInput`.

- [ ] **Step 6: Verificar que compila**

Run: `pnpm build && pnpm test`
Expected: build limpio; todos los tests PASS.

- [ ] **Step 7: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/properties/api/ FrontEndUrbanos/src/features/admin/properties/hooks/useInmuebles.ts
git commit -m "feat(inmuebles): API y hooks para leer y actualizar un inmueble"
```

---

### Task 5: Extraer InmuebleForm reutilizable

**Files:**
- Create: `FrontEndUrbanos/src/features/admin/properties/components/InmuebleForm.tsx`
- Modify: `FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx`

**Interfaces:**
- Consumes: `inmuebleSchema`, `valoresPorDefecto`, `InmuebleFormInput`, `InmuebleFormParsed` (Task 2).
- Produces: componente `InmuebleForm` con props:
  ```ts
  interface InmuebleFormProps {
    valoresIniciales?: Partial<InmuebleFormInput>
    onSubmit: (datos: InmuebleFormParsed) => Promise<void>
    enviando: boolean
    textoBoton: string
    /** Se renderiza en la sidebar; en creación es TarjetaFotos, en edición GaleriaImagenes. */
    panelFotos?: React.ReactNode
    deshabilitado?: boolean
  }
  ```

**Este es el paso de mayor riesgo del plan.** Es un movimiento **puro**: no se cambia ni una regla de validación ni una clase de Tailwind. Si aparece la tentación de "mejorar algo de paso", no se hace.

- [ ] **Step 1: Crear InmuebleForm con el marcado movido tal cual**

Crear `components/InmuebleForm.tsx` y mover ahí, **sin editarlo**, todo el JSX del formulario de `InmuebleFormPage.tsx` (desde el `<form>` hasta su cierre), junto con `useForm`, `useWatch`, `alFallarValidacion`, y los hooks de catálogo (`useTiposInmueble`, `useUbicaciones`, `useCaracteristicas`) y sus estados de carga/error, que son responsabilidad del formulario y no de la página.

La firma:

```tsx
export function InmuebleForm({
  valoresIniciales,
  onSubmit,
  enviando,
  textoBoton,
  panelFotos,
  deshabilitado = false,
}: InmuebleFormProps) {
```

y `useForm` se inicializa con:

```tsx
defaultValues: { ...valoresPorDefecto, ...valoresIniciales },
```

El botón de submit usa `{textoBoton}` en vez del literal, y donde antes iba `<TarjetaFotos .../>` ahora va `{panelFotos}`.

- [ ] **Step 2: Reducir InmuebleFormPage a envoltura de creación**

`InmuebleFormPage.tsx` queda solo con: el `useState` de `inmuebleCreadoId`, el hook `useCrearInmueble`, el armado del payload de creación (reusando `aDatosInput` de la Task 3), el `<TarjetaFotos>` / `<GaleriaImagenes>` según haya id, y el render de `<InmuebleForm>`.

```tsx
const onSubmit = async (datos: InmuebleFormParsed) => {
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
```

Nótese que en creación `aOperacionesUpsert(datos, [])` nunca produce desactivaciones, porque no hay operaciones previas — exactamente el caso cubierto por el test "no envía nada para una operación que nunca existió".

- [ ] **Step 3: Verificar que compila**

Run: `pnpm build`
Expected: sin errores de TypeScript.

- [ ] **Step 4: Verificar a mano que crear sigue funcionando**

Este paso **no es opcional**: es la única red bajo el refactor, porque no hay tests de DOM.

1. Levantar backend (`dotnet run --project src/Portal.Api` desde `Backend/`) y front (`pnpm dev`).
2. Entrar a `/admin/properties/nuevo`, llenar el formulario **con solo venta** y guardar.
3. Confirmar: se crea, aparece la galería de fotos, y el inmueble sale en `/admin/properties`.
4. Repetir **con solo arriendo**. Ambos casos deben pasar — antes del arreglo de la Task 2, fallaban.

- [ ] **Step 5: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/properties/components/InmuebleForm.tsx FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx
git commit -m "refactor(inmuebles): extrae InmuebleForm reutilizable de la página de alta"
```

---

### Task 6: Página de edición, ruta y acceso desde la lista

**Files:**
- Create: `FrontEndUrbanos/src/features/admin/properties/pages/InmuebleEditarPage.tsx`
- Modify: `FrontEndUrbanos/src/app/router/index.tsx`
- Modify: `FrontEndUrbanos/src/features/admin/properties/pages/InmueblesPage.tsx`

**Interfaces:**
- Consumes: `InmuebleForm` (Task 5), `useInmueble` / `useActualizarInmueble` (Task 4), `aValoresFormulario` / `aDatosInput` / `aOperacionesUpsert` (Task 3), `GaleriaImagenes` (ya existente, recibe `inmuebleId: number`).
- Produces: ruta `/admin/properties/:id/editar`.

- [ ] **Step 1: Crear InmuebleEditarPage**

Crear `pages/InmuebleEditarPage.tsx`:

```tsx
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
```

El manejo de errores de submit lo hereda de `InmuebleForm`, que ya envuelve `onSubmit` en try/catch y publica el mensaje en `errors.root` vía `mensajeDeError` (movido en la Task 5).

- [ ] **Step 2: Registrar la ruta**

En `app/router/index.tsx`, añadir el import junto a los demás de admin:

```ts
import { InmuebleEditarPage } from '@/features/admin/properties/pages/InmuebleEditarPage'
```

y **una sola línea** justo debajo de `properties/nuevo` (línea 59), sin reordenar nada:

```tsx
{ path: 'properties/:id/editar', element: <InmuebleEditarPage /> },
```

- [ ] **Step 3: Agregar la acción "Editar" en el listado**

En `InmueblesPage.tsx`, en la fila de acciones donde ya viven publicar/pausar/destacar/eliminar, añadir como **primera** acción:

```tsx
<Link to={`/admin/properties/${inmueble.id}/editar`}>
  <Button size="sm" variant="ghost">
    Editar
  </Button>
</Link>
```

`Link` ya está importado en el archivo (línea 2).

- [ ] **Step 4: Verificar que compila y que los tests pasan**

Run: `pnpm build && pnpm test`
Expected: build limpio; todos los tests PASS.

- [ ] **Step 5: Verificar a mano el flujo completo**

Con backend y front levantados:

1. `/admin/properties` → "Editar" en un inmueble → carga con sus valores actuales.
2. Cambiar el título y guardar → el listado refleja el cambio sin recargar.
3. Cambiar el precio de venta y guardar → persiste tras recargar la página.
4. Marcar arriendo con su canon y guardar → aparecen las dos operaciones.
5. Desmarcar arriendo y guardar → queda solo venta (se desactivó, no dio 400).
6. Subir una foto y marcarla como portada → aparece en el listado.
7. Entrar a `/admin/properties/999999/editar` → "Inmueble no encontrado", sin spinner eterno.

- [ ] **Step 6: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/properties/pages/InmuebleEditarPage.tsx FrontEndUrbanos/src/app/router/index.tsx FrontEndUrbanos/src/features/admin/properties/pages/InmueblesPage.tsx
git commit -m "feat(inmuebles): pantalla de edición con campos, operaciones y fotos"
```

---

## Cobertura del spec

| Requisito del spec | Tarea |
|---|---|
| Vitest sin DOM, script `test` | 1 |
| `schemas/inmuebleSchema.ts` en archivo propio | 2 |
| Arreglo del bug de Zod 4 en `numeroOpcional` | 2 |
| `getInmuebleAdmin`, `actualizarInmueble`, upsert de operaciones | 4 |
| `useInmueble`, `useActualizarInmueble` | 4 |
| Invalidar `['inmuebles']` y el detalle | 4 |
| Una llamada por operación; desactivar con `activo: false` y precio previo | 3, 4 |
| `InmuebleForm` compartido; páginas delgadas | 5 |
| `InmuebleEditarPage` + `GaleriaImagenes` sobre inmueble existente | 6 |
| Ruta `properties/:id/editar` (diff aditivo) | 6 |
| Acción "Editar" en el listado | 6 |
| 404 / id inválido → "Inmueble no encontrado" | 6 |
| Estado de carga durante `useInmueble` | 6 |
| Verificación manual de que crear sigue funcionando | 5 |

## Riesgos conocidos

- **La Task 5 no tiene red automatizada.** Es un movimiento de ~500 líneas de JSX sin tests de DOM. Mitigación: movimiento puro más el paso 4 de verificación manual, que es obligatorio.
- **El mapeo de `amoblado`.** El DTO lo trae como `string | null` y el schema exige el enum `'si' | 'no' | 'semi'`. `aValoresFormulario` cae a `'no'` cuando viene null; si el backend llegara a devolver otro literal, el schema lo rechazaría al primer submit. El test "produce valores que el schema acepta" cubre el caso normal.
- **Sin transacción entre campos y operaciones.** Si `PUT /{id}` pasa y una operación falla, el inmueble queda con campos nuevos y operaciones viejas. Es aceptable aquí (el usuario ve el error y reintenta) y evitarlo exigiría un endpoint transaccional nuevo en el backend, fuera del alcance.
