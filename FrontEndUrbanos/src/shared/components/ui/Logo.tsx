/**
 * Aísla el logo en un único punto del código.
 *
 * TODO(cliente): falta el archivo del logo. El sitio actual lo sirve como GIF
 * en base64 con lazy-load, sin URL de origen, así que no se pudo extraer.
 * Por decisión del cliente el slot va en blanco — deliberadamente NO se
 * sustituye por un logotipo tipográfico. Reserva sus dimensiones para que el
 * header no salte de layout el día que llegue el SVG.
 */
interface LogoProps {
  /**
   * Aceptada ya para que las llamadas no cambien cuando llegue el archivo:
   * `light` será la versión sobre el hero y el footer. Hoy no tiene efecto
   * porque el slot está vacío.
   */
  variant?: 'dark' | 'light'
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return <span aria-hidden="true" className={['block h-10 w-[180px]', className].join(' ')} />
}
