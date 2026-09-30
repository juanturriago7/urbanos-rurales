/**
 * Un elemento de la paginación: un número de página o una elipsis. Las dos
 * elipsis tienen nombres distintos para que sirvan de `key` en React.
 */
export type ItemPagina = number | 'elipsis-inicio' | 'elipsis-fin'

const MAX_ITEMS = 7

/**
 * Ventana de páginas alrededor de la actual, con la primera y la última
 * siempre visibles. Devuelve siempre 7 elementos cuando hay más de 7 páginas,
 * así la barra no cambia de ancho al navegar.
 *
 * Antes se pintaban las páginas 1–7 fijas: desde la 8 ningún botón quedaba
 * activo y no había forma de llegar a las intermedias.
 */
export function paginasVisibles(actual: number, total: number): ItemPagina[] {
  if (total <= MAX_ITEMS) return Array.from({ length: total }, (_, i) => i + 1)

  const pagina = Math.min(Math.max(actual, 1), total)

  if (pagina <= 4) return [1, 2, 3, 4, 5, 'elipsis-fin', total]
  if (pagina >= total - 3) {
    return [1, 'elipsis-inicio', total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, 'elipsis-inicio', pagina - 1, pagina, pagina + 1, 'elipsis-fin', total]
}
