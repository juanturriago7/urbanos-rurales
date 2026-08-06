/**
 * Logotipo tipográfico de Urbanos & Rurales.
 *
 * Serif principal (Playfair Display) + tagline en tracking ultrawido.
 * Variante `dark` : carbón sobre fondos claros/crema.
 * Variante `light`: crema/blanco sobre fondos oscuros o fotos.
 *
 * TODO(cliente): reemplazar por el SVG oficial cuando el cliente lo provea.
 */
interface LogoProps {
  variant?: 'dark' | 'light'
  className?: string
}

export function Logo({ variant = 'dark', className = '' }: LogoProps) {
  const isLight = variant === 'light'

  return (
    <span className={['flex flex-col items-start leading-none select-none', className].join(' ')}>
      <span
        className={[
          'font-serif text-[19px] font-bold tracking-[0.06em]',
          isLight ? 'text-[#faf8f5]' : 'text-[#1c1917]',
        ].join(' ')}
      >
        URBANOS
        <span
          className={[
            'mx-1.5 inline-block text-[12px] font-light',
            isLight ? 'text-[#faf8f5]/40' : 'text-[#8b6f4e]/60',
          ].join(' ')}
        >
          &amp;
        </span>
        RURALES
      </span>
      <span
        className={[
          'mt-1 text-[7px] font-semibold tracking-[0.32em] uppercase',
          isLight ? 'text-[#faf8f5]/40' : 'text-[#1c1917]/35',
        ].join(' ')}
      >
        Bienes Raíces · Colombia
      </span>
    </span>
  )
}
