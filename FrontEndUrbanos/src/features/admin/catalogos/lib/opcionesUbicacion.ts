import type { UbicacionDto } from '@/features/admin/catalogos/api/catalogosApi'
import type { ComboboxOpcion } from '@/shared/components/ui/Combobox'

/**
 * Opciones del combobox de ubicación del formulario de inmueble. Vive aparte y
 * sin React para poder probarlo en Vitest sin DOM.
 *
 * El árbol llega de `GET /api/catalogos/ubicaciones` (zona → localidad → upz,
 * sin barrios). Todos los niveles son seleccionables: el inmueble se asocia a la
 * ubicación más específica que conozca el asesor.
 */

const ETIQUETA_TIPO: Record<UbicacionDto['tipo'], string> = {
  zona: 'Zona',
  localidad: 'Localidad',
  upz: 'UPZ',
  barrio: 'Barrio',
}

export const ETIQUETA_UBICACION_FUERA_DE_CATALOGO = 'Ubicación actual (fuera del catálogo activo)'

const DESCRIPCION_UBICACION_FUERA_DE_CATALOGO =
  'Está desactivada o no se ofrece en este selector. Se conserva si no la cambias.'

/** Minúsculas, sin tildes ni diéresis y sin espacios en los extremos: "Usaquén " → "usaquen". */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/**
 * Aplana el árbol en orden de recorrido. La etiqueta es solo el nombre; la
 * descripción dice el nivel y la ruta de ancestros ("UPZ — Norte › Chapinero")
 * para distinguir nombres parecidos sin depender de la indentación, que los
 * navegadores no respetan dentro de un <option> y que un combobox no necesita.
 */
export function construirOpcionesUbicacion(
  nodos: UbicacionDto[],
  ancestros: string[] = [],
): ComboboxOpcion[] {
  return nodos.flatMap((nodo) => {
    const tipo = ETIQUETA_TIPO[nodo.tipo]
    const descripcion = ancestros.length > 0 ? `${tipo} — ${ancestros.join(' › ')}` : tipo
    return [
      { id: nodo.id, etiqueta: nodo.nombre, descripcion },
      ...construirOpcionesUbicacion(nodo.hijos ?? [], [...ancestros, nodo.nombre]),
    ]
  })
}

/**
 * Filtra por el término ignorando tildes y mayúsculas. Orden del resultado:
 * primero los nombres que empiezan por el término, luego los que lo contienen y
 * al final los que solo coinciden por la descripción (p. ej. "chapinero" también
 * trae sus UPZ). Dentro de cada grupo se respeta el orden del árbol (sort estable).
 */
export function filtrarOpcionesUbicacion(
  opciones: ComboboxOpcion[],
  query: string,
): ComboboxOpcion[] {
  const termino = normalizarTexto(query)
  if (termino === '') return opciones

  const puntuadas = opciones.flatMap((opcion) => {
    const nombre = normalizarTexto(opcion.etiqueta)
    const puntaje = nombre.startsWith(termino)
      ? 0
      : nombre.includes(termino)
        ? 1
        : normalizarTexto(opcion.descripcion ?? '').includes(termino)
          ? 2
          : -1
    return puntaje < 0 ? [] : [{ opcion, puntaje }]
  })

  return puntuadas.sort((a, b) => a.puntaje - b.puntaje).map((p) => p.opcion)
}

/**
 * Traduce el valor del formulario (`ubicacionId`) a la selección del combobox.
 * Si el id no está en el árbol (ubicación desactivada, o un barrio asignado por
 * un script de carga) se conserva con una etiqueta neutra: guardar sin tocar el
 * campo no cambia la ubicación del inmueble. El id nunca se muestra.
 */
export function resolverSeleccionUbicacion(
  opciones: ComboboxOpcion[],
  valor: unknown,
): ComboboxOpcion | null {
  if (valor === '' || valor === null || valor === undefined) return null
  const id = Number(valor)
  if (!Number.isFinite(id) || id <= 0) return null

  return (
    opciones.find((o) => o.id === id) ?? {
      id,
      etiqueta: ETIQUETA_UBICACION_FUERA_DE_CATALOGO,
      descripcion: DESCRIPCION_UBICACION_FUERA_DE_CATALOGO,
    }
  )
}

/**
 * True cuando `seleccion` es la opción sintética que arma resolverSeleccionUbicacion
 * para un id que no está en el árbol de opciones vigente (ubicación desactivada o
 * fuera de catálogo). Combobox solo pinta `seleccion.etiqueta`, así que el llamador
 * usa esto para decidir si además debe mostrar `seleccion.descripcion` como hint.
 */
export function esUbicacionFueraDeCatalogo(
  opciones: ComboboxOpcion[],
  seleccion: ComboboxOpcion | null,
): boolean {
  if (seleccion === null) return false
  return !opciones.some((o) => o.id === seleccion.id)
}
