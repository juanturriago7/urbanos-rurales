/**
 * Normalización de la descripción libre de un inmueble.
 *
 * El texto llega tal como lo escribió el asesor en el admin, y casi siempre
 * viene pegado de un Word: con saltos de línea duros cada ~60 caracteres. Si se
 * pinta con `whitespace-pre-line` esos saltos se respetan y el párrafo corta
 * donde cortaba el Word, no donde termina el contenedor — que es justo lo que
 * hace que los renglones se vean descuadrados en móvil.
 *
 * Esta función devuelve bloques listos para pintar: los saltos sueltos se unen
 * para que el texto fluya, las líneas en blanco separan párrafos, y las viñetas
 * se conservan como lista (unirlas también las dejaría en un renglón ilegible).
 */

export type BloqueDescripcion =
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'lista'; items: string[] }

/** `-`, `*`, `•`, guiones largos, o numeradas (`1.` / `1)`) al inicio de línea. */
const VINETA = /^\s*(?:[-*•–—]|\d+[.)])(?=\s|$)/

/** Deja el texto en una sola línea, sin espacios repetidos ni en los extremos. */
function compactar(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

export function normalizarDescripcion(texto: string): BloqueDescripcion[] {
  if (!texto) return []

  // Los bloques se separan por líneas en blanco; varias seguidas cuentan como una.
  const bloques = texto.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n\s*/)

  return bloques.flatMap(dividirBloque)
}

function dividirBloque(bloque: string): BloqueDescripcion[] {
  const salida: BloqueDescripcion[] = []
  const lineasParrafo: string[] = []
  const items: string[] = []

  function cerrarParrafo() {
    const texto = compactar(lineasParrafo.join(' '))
    lineasParrafo.length = 0
    if (texto) salida.push({ tipo: 'parrafo', texto })
  }

  for (const linea of bloque.split('\n')) {
    if (VINETA.test(linea)) {
      // La primera viñeta cierra la frase que la introduce ("El conjunto incluye:").
      cerrarParrafo()
      items.push(linea.replace(VINETA, ''))
    } else if (items.length > 0) {
      // Sin viñeta y ya dentro de la lista: es la continuación del último ítem.
      items[items.length - 1] += ` ${linea}`
    } else {
      lineasParrafo.push(linea)
    }
  }

  cerrarParrafo()

  const itemsLimpios = items.map(compactar).filter(Boolean)
  if (itemsLimpios.length > 0) salida.push({ tipo: 'lista', items: itemsLimpios })

  return salida
}
