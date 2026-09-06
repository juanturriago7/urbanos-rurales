import { describe, expect, it } from 'vitest'
import { inmuebleSchema } from '@/features/admin/properties/schemas/inmuebleSchema'

/**
 * Base válida mínima, sin ninguna clave de precio. `esPropiedadHorizontal:
 * false` (una casa, no PH) exige área de terreno — ver el describe de abajo
 * dedicado a esa regla cruzada — así que la base ya la trae para que el resto
 * de los tests (que no les interesa el área) no tengan que preocuparse por
 * eso.
 */
const base = {
  titulo: 'Casa en Chía',
  tipoInmuebleId: 1,
  esPropiedadHorizontal: false,
  areaTerrenoM2: 500,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta a propósito para omitir la clave
    const { precioVenta: _omitido, ...sinVenta } = base
    const r = inmuebleSchema.safeParse({
      ...sinVenta,
      tieneVenta: false,
      tieneArriendo: true,
      precioArriendo: 2500000,
    })
    expect(r.success).toBe(true)
  })

  it('acepta que las áreas no exigidas por el tipo estén ausentes', () => {
    const r = inmuebleSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.areaConstruidaM2).toBeNull()
      expect(r.data.areaPrivadaM2).toBeNull()
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

  it('caracteristicaTextos ausente se normaliza a objeto vacío', () => {
    const r = inmuebleSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.caracteristicaTextos).toEqual({})
  })

  it('conserva los valores tecleados de caracteristicaTextos (número/texto)', () => {
    const r = inmuebleSchema.safeParse({
      ...base,
      caracteristicaTextos: { '5': '4', '8': 'Norte' },
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.caracteristicaTextos).toEqual({ '5': '4', '8': 'Norte' })
  })
})

describe('inmuebleSchema — área según tipo de inmueble (PH vs. terreno)', () => {
  it('un tipo no-PH (casa, lote...) exige área de terreno', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta a propósito para omitir la clave
    const { areaTerrenoM2: _omitido, ...sinTerreno } = base
    const r = inmuebleSchema.safeParse(sinTerreno)
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('areaTerrenoM2'))).toBe(true)
    }
  })

  it('un tipo no-PH NO exige área construida', () => {
    const r = inmuebleSchema.safeParse(base) // esPropiedadHorizontal: false, sin areaConstruidaM2
    expect(r.success).toBe(true)
  })

  it('un tipo PH (apartamento, oficina...) exige área construida', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta a propósito para omitir la clave
    const { areaTerrenoM2: _omitido, ...sinTerreno } = base
    const r = inmuebleSchema.safeParse({
      ...sinTerreno,
      esPropiedadHorizontal: true,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('areaConstruidaM2'))).toBe(true)
    }
  })

  it('un tipo PH con área construida pasa sin necesidad de área de terreno', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta a propósito para omitir la clave
    const { areaTerrenoM2: _omitido, ...sinTerreno } = base
    const r = inmuebleSchema.safeParse({
      ...sinTerreno,
      esPropiedadHorizontal: true,
      areaConstruidaM2: 80,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.areaTerrenoM2).toBeNull()
  })

  it('sin tipo seleccionado, no exige ningún área todavía (solo falla tipoInmuebleId)', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta a propósito para omitir la clave
    const { areaTerrenoM2: _omitido, tipoInmuebleId: _tipo, ...resto } = base
    const r = inmuebleSchema.safeParse({ ...resto, tipoInmuebleId: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('areaTerrenoM2'))).toBe(false)
      expect(r.error.issues.some((i) => i.path.includes('tipoInmuebleId'))).toBe(true)
    }
  })
})
