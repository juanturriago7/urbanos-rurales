/**
 * Lockup de marca de Urbanos & Rurales: monograma + nombre + bajada.
 *
 * Antes estaba escrito a mano tres veces (Header, Footer y MobileDrawer), con
 * una caja y un tracking distinto en cada sitio. De ahí venía el monograma
 * descentrado: el `tracking` del texto se aplica también DESPUÉS del último
 * carácter, así que la caja del span queda más ancha que la tinta y el centrado
 * por flex reparte mal ese sobrante. Aquí el monograma va sin tracking y con
 * `leading-none`, y la caja se centra con grid.
 *
 * TODO(cliente): cuando llegue el logo oficial, sustituir solo <Monograma> por
 * un <img>/<svg>; el resto del lockup y sus tres usos no cambian.
 */
interface LogoProps {
  /** `dark` para fondos claros, `light` para el navy del footer. */
  variant?: 'dark' | 'light'
  /** Bajada bajo el nombre. `false` la oculta (menú móvil, espacios estrechos). */
  tagline?: string | false
  className?: string
}

const TAGLINE_POR_DEFECTO = 'Gestión Inmobiliaria · S.A.S'

export function Logo({
  variant = 'dark',
  tagline = TAGLINE_POR_DEFECTO,
  className = '',
}: LogoProps) {
  const isLight = variant === 'light'

  return (
    <span className={['flex items-center gap-2.5 select-none', className].join(' ')}>
      {/* Monograma — `grid place-items-center` centra la caja del texto sin que
          la altura de línea arrastre la posición, como sí pasa con flex+baseline. */}
      <span
        className={[
          'grid h-10 w-10 shrink-0 place-items-center rounded-[8px] sm:h-11 sm:w-11',
          isLight ? 'bg-white/12' : 'bg-[#004b98]',
        ].join(' ')}
        aria-hidden="true"
      >
        <span className="text-[13px] leading-none font-extrabold text-white sm:text-[14px]">
          U&amp;R
        </span>
      </span>

      <span className="flex min-w-0 flex-col gap-[3px] leading-none">
        <span
          className={[
            'text-[14px] font-bold tracking-[-0.3px] whitespace-nowrap sm:text-[15px]',
            isLight ? 'text-white' : 'text-[#001124]',
          ].join(' ')}
        >
          Urbanos &amp; Rurales
        </span>
        {tagline !== false && (
          <span
            className={[
              'text-[10px] tracking-[0.8px] whitespace-nowrap uppercase',
              isLight ? 'text-[#577782]' : 'text-[#7a8187]',
            ].join(' ')}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  )
}
