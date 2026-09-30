/**
 * Tipos de parqueadero de un inmueble, selección múltiple y opcional.
 *
 * Los valores son los del contrato de API (Inmueble.TiposParqueaderoValidos en el
 * backend, y el CHECK ck_inmuebles_tipos_parqueadero). El orden de este arreglo es
 * el canónico: así los guarda el backend y así se muestran. Las etiquetas son las
 * que ve el usuario en el admin y en la ficha pública.
 */
export const TIPOS_PARQUEADERO = ['privado', 'privado_uso_exclusivo', 'doble'] as const

export type TipoParqueadero = (typeof TIPOS_PARQUEADERO)[number]

export const ETIQUETAS_TIPO_PARQUEADERO: Record<TipoParqueadero, string> = {
  privado: 'Privado',
  privado_uso_exclusivo: 'Privado de uso exclusivo',
  doble: 'Doble (2 en línea)',
}

/** Solo los tipos conocidos, sin repetidos y en orden canónico. */
function filtrarConocidos(tipos: readonly string[] | null | undefined): TipoParqueadero[] {
  const lista = tipos ?? []
  return TIPOS_PARQUEADERO.filter((t) => lista.includes(t))
}

/**
 * Deja los tipos como los guarda el backend. Sin parqueaderos no hay tipo; si los
 * hay, se descartan los desconocidos y los repetidos. Tolera `null`/`undefined`
 * por si la respuesta viene de una API anterior a la columna.
 */
export function normalizarTiposParqueadero(
  parqueaderos: number,
  tipos: readonly string[] | null | undefined,
): TipoParqueadero[] {
  // `!(x > 0)` y no `x <= 0`: NaN no es "mayor" ni "menor" que nada.
  if (!(parqueaderos > 0)) return []
  return filtrarConocidos(tipos)
}

/** "Privado, Doble (2 en línea)". Cadena vacía si no hay tipos. */
export function describirTiposParqueadero(tipos: readonly string[] | null | undefined): string {
  return filtrarConocidos(tipos)
    .map((t) => ETIQUETAS_TIPO_PARQUEADERO[t])
    .join(', ')
}

/** Texto de la ficha pública: "1 parqueadero" o "2 parqueaderos · Privado, Doble (2 en línea)". */
export function textoParqueaderos(
  parqueaderos: number,
  tipos: readonly string[] | null | undefined,
): string {
  const cantidad = `${parqueaderos} ${parqueaderos === 1 ? 'parqueadero' : 'parqueaderos'}`
  const detalle = describirTiposParqueadero(normalizarTiposParqueadero(parqueaderos, tipos))
  return detalle ? `${cantidad} · ${detalle}` : cantidad
}

/**
 * ¿El valor del input "Parqueaderos" es 1 o más? El `<input type="number">`
 * entrega string, y vacío o texto no numérico cuentan como 0.
 */
export function hayParqueaderos(valor: unknown): boolean {
  return Number(valor) > 0
}
