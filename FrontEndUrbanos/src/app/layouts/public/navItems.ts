/**
 * Menú del sitio público.
 *
 * Arriendos va primero porque es el foco declarado del producto. "Blog" no
 * aparece: no hay contenido, y un item que lleva a una página vacía es peor
 * que un item ausente.
 *
 * Los items con `anchor` no tienen ruta propia; hacen scroll a una sección de
 * la landing vía `AnchorLink`.
 */
export interface NavItem {
  label: string
  to: string
  anchor?: string
}

export const navItems: readonly NavItem[] = [
  { label: 'Arrendar', to: '/inmuebles?operacion=arriendo' },
  { label: 'Comprar', to: '/inmuebles?operacion=venta' },
  { label: 'Consignar', to: '/', anchor: 'consignar' },
  { label: 'Servicios', to: '/', anchor: 'servicios' },
  { label: 'Contacto', to: '/', anchor: 'contacto' },
] as const
