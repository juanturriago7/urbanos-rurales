import type { ElementType, ReactNode } from 'react'

/**
 * Ancho máximo y padding lateral del contenido.
 *
 * `editorial` (1200px) es para landing y páginas institucionales; `wide`
 * (1440px) para el marketplace, que necesita caber más columnas de resultados.
 */
interface ContainerProps {
  width?: 'editorial' | 'wide'
  as?: ElementType
  className?: string
  children: ReactNode
}

const anchoClases: Record<NonNullable<ContainerProps['width']>, string> = {
  editorial: 'max-w-[1200px]',
  wide: 'max-w-[1440px]',
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
