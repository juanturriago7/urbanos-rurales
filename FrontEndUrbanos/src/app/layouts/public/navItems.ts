/**
 * Menú del sitio público.
 *
 * Arriendos va primero porque es el foco declarado del producto.
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
  { label: 'Inicio', to: '/' },
  { label: 'Quiénes somos', to: '/', anchor: 'quienes-somos' },
  { label: 'Servicios', to: '/', anchor: 'servicios' },
  { label: 'Inmuebles', to: '/inmuebles' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contacto', to: '/', anchor: 'contacto' },
] as const
