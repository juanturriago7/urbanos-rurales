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
    const payload = aDatosInput(datos) as unknown as Record<string, unknown>
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

/**
 * PUT /api/admin/inmuebles/{id} es un reemplazo completo: toda clave ausente
 * del body llega como null al repositorio y borra la columna. El formulario no
 * edita metaTitulo, metaDescripcion, asesorId ni el `valor` de las
 * características, así que la edición tiene que devolvérselos al backend.
 */
describe('aDatosInput al editar (campos que el formulario no edita)', () => {
  const dtoConMetadatos: InmuebleAdminDetalleDto = {
    ...dto,
    metaTitulo: 'Casa en Chía con vista a la montaña',
    metaDescripcion: 'Casa campestre de 180 m² construidos en Chía, Cundinamarca.',
    asesorId: 42,
    caracteristicas: [
      { caracteristicaId: 3, nombre: 'Piscina', categoria: 'Exteriores', valor: '8x4 m' },
      { caracteristicaId: 7, nombre: 'Gimnasio', categoria: 'Comunes', valor: null },
    ],
  }

  it('reenvía metaTitulo, metaDescripcion y asesorId del detalle cargado', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dtoConMetadatos))
    const payload = aDatosInput(datos, dtoConMetadatos)

    expect(payload.metaTitulo).toBe('Casa en Chía con vista a la montaña')
    expect(payload.metaDescripcion).toBe(
      'Casa campestre de 180 m² construidos en Chía, Cundinamarca.',
    )
    expect(payload.asesorId).toBe(42)
  })

  it('reenvía el valor de cada característica que ya lo tenía', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dtoConMetadatos))

    expect(aDatosInput(datos, dtoConMetadatos).caracteristicas).toEqual([
      { caracteristicaId: 3, valor: '8x4 m' },
      { caracteristicaId: 7, valor: null },
    ])
  })

  it('no inventa valor para una característica recién marcada', () => {
    const valores = aValoresFormulario(dtoConMetadatos)
    const datos = inmuebleSchema.parse({ ...valores, caracteristicaIds: [3, 9] })

    expect(aDatosInput(datos, dtoConMetadatos).caracteristicas).toEqual([
      { caracteristicaId: 3, valor: '8x4 m' },
      { caracteristicaId: 9 },
    ])
  })

  it('el alta (sin detalle previo) no emite ninguna de esas claves', () => {
    // El POST de creación no tiene nada que preservar y no debe mandar nulls
    // que pisen los valores por defecto del backend.
    const datos = inmuebleSchema.parse(aValoresFormulario(dtoConMetadatos))
    const payload = aDatosInput(datos) as unknown as Record<string, unknown>

    expect(payload).not.toHaveProperty('metaTitulo')
    expect(payload).not.toHaveProperty('metaDescripcion')
    expect(payload).not.toHaveProperty('asesorId')
    expect(payload.caracteristicas).toEqual([{ caracteristicaId: 3 }, { caracteristicaId: 7 }])
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
    //
    // La clave `precioArriendo` se OMITE del formulario a propósito. Dos
    // razones, y la segunda es la que hace válido al test:
    //
    // 1. Es lo que pasa de verdad: al desmarcar el checkbox el campo deja de
    //    renderizarse, RHF nunca lo registra y la clave llega ausente.
    // 2. Discrimina entre las dos fuentes posibles del precio. Si se dejara
    //    el valor del formulario intacto, coincidiría con `previa.precio`
    //    (ambos 2500000) y el test pasaría igual con una implementación que
    //    leyera `datos.precioArriendo` — es decir, no probaría nada. Omitida,
    //    esa implementación incorrecta enviaría null y el test fallaría.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { precioArriendo: _omitido, ...sinCanon } = aValoresFormulario({
      ...dto,
      operaciones: [opVenta, opArriendo],
    })
    const datos = inmuebleSchema.parse({ ...sinCanon, tieneArriendo: false })
    const ops = aOperacionesUpsert(datos, [opVenta, opArriendo])
    const arriendo = ops.find((o) => o.tipoOperacion === 'arriendo')
    expect(arriendo).toBeDefined()
    expect(arriendo!.activo).toBe(false)
    expect(arriendo!.precio).toBe(2500000)
    expect(arriendo!.cuotaAdministracion).toBe(300000)
  })

  it('no reenvía una operación que ya estaba inactiva y sigue desmarcada', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dto))
    const ops = aOperacionesUpsert(datos, [opVenta, { ...opArriendo, activo: false }])
    expect(ops.some((o) => o.tipoOperacion === 'arriendo')).toBe(false)
  })

  it('no envía nada para una operación que nunca existió y sigue desmarcada', () => {
    const datos = inmuebleSchema.parse(aValoresFormulario(dto))
    const ops = aOperacionesUpsert(datos, [opVenta])
    expect(ops.some((o) => o.tipoOperacion === 'arriendo')).toBe(false)
  })
})
