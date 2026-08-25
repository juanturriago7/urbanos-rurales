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
