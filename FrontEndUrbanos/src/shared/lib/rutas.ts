/**
 * `true` en la ficha pública de un inmueble (`/inmuebles/:slug`). La usan el
 * layout y el FAB: en esa ruta hay una barra de contacto fija abajo en móvil.
 */
export function esRutaFichaInmueble(pathname: string): boolean {
  return /^\/inmuebles\/[^/]+\/?$/.test(pathname)
}
