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
    // Espejo del flag del catálogo tipos_inmueble para el tipo seleccionado —
    // lo sincroniza InmuebleForm vía setValue al cambiar tipoInmuebleId. No es
    // un campo que el usuario edite directamente: decide cuál área es
    // obligatoria en los refine() de abajo (ver comentario ahí).
    esPropiedadHorizontal: z.boolean().default(false),
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

    // Características de tipo `numero` o `texto`: el formulario las registra como
    // `caracteristicaTextos.<id>` (un input, no un checkbox del grupo de arriba).
    // Clave = id de la característica; valor = lo tecleado, sin normalizar. Las
    // entradas vacías las descarta el mapper (aDatosInput), no el schema, porque
    // RHF deja `{ '5': '' }` en un campo que se tocó y luego se borró.
    caracteristicaTextos: z.record(z.string(), z.string()).default({}),
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
  // Spec 03 — regla cruzada con el catálogo de tipos: propiedad horizontal
  // (apartamento, oficina, local...) exige área construida; el resto (casa,
  // lote, bodega...) exige área de terreno. Se ignora mientras no haya tipo
  // seleccionado (tipoInmuebleId ya lo bloquea con su propio mensaje) para no
  // mostrar un error de área antes de que el usuario elija el tipo.
  // `!(v > 0)` en vez de `v <= 0`: tipoInmuebleId puede llegar como NaN si el
  // usuario aún no elige tipo, y `NaN <= 0` es false (NaN no compara como
  // "mayor" ni "menor" que nada), lo que dispararía el error de área ANTES de
  // que se seleccione un tipo, encima del error propio de tipoInmuebleId.
  .refine((d) => !(d.tipoInmuebleId > 0) || d.esPropiedadHorizontal || (d.areaTerrenoM2 !== null && d.areaTerrenoM2 > 0), {
    message: 'El área de terreno es obligatoria para este tipo de inmueble',
    path: ['areaTerrenoM2'],
  })
  .refine((d) => !(d.tipoInmuebleId > 0) || !d.esPropiedadHorizontal || (d.areaConstruidaM2 !== null && d.areaConstruidaM2 > 0), {
    message: 'El área construida es obligatoria para este tipo de inmueble',
    path: ['areaConstruidaM2'],
  })

export type InmuebleFormInput = z.input<typeof inmuebleSchema>
export type InmuebleFormParsed = z.output<typeof inmuebleSchema>

/** defaultValues de React Hook Form para el alta de un inmueble nuevo. */
export const valoresPorDefecto: Partial<InmuebleFormInput> = {
  esPropiedadHorizontal: false,
  politicaMascotas: 'no_permitidas',
  amoblado: 'no',
  habitaciones: 0,
  banos: 0,
  parqueaderos: 0,
  tieneVenta: true,
  tieneArriendo: false,
  adminIncluidaArriendo: false,
  caracteristicaIds: [],
  caracteristicaTextos: {},
}
