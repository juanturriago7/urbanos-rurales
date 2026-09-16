import type { ElementType, ReactNode } from 'react'

/**
 * Ancho máximo y padding lateral del contenido.
 *
 * Centraliza el padding lateral responsive de todo el sitio público: antes cada
 * sección lo repetía a mano como `px-12`, que en un móvil de 360px se comía 96px
 * — más de la cuarta parte del ancho útil.
 *
 * `editorial` (1200px) es para landing y páginas institucionales; `wide`
 * (1440px) para el marketplace, que necesita caber más columnas de resultados;
 * `narrow` y `prose` para bloques de lectura, donde un renglón de 1200px es
 * demasiado largo para seguirlo con la vista.
 */
interface ContainerProps {
  width?: 'editorial' | 'wide' | 'narrow' | 'prose'
  as?: ElementType
  className?: string
  children: ReactNode
}

const anchoClases: Record<NonNullable<ContainerProps['width']>, string> = {
  editorial: 'max-w-[1200px]',
  wide: 'max-w-[1440px]',
  narrow: 'max-w-[900px]',
  prose: 'max-w-[720px]',
}

export function Container({
  width = 'editorial',
  as: Tag = 'div',
  className = '',
  children,
}: ContainerProps) {
  return (
    <Tag className={['mx-auto w-full px-4 sm:px-6', anchoClases[width], className].join(' ')}>
      {children}
    </Tag>
  )
}
