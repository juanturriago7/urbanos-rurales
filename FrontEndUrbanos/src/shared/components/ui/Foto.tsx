import type { FotoCatalogo } from '@/assets/fotos'

interface FotoProps {
  foto: FotoCatalogo
  /** Ancho con que se muestra, para que el navegador elija variante del srcSet. */
  sizes: string
  /**
   * true solo para la imagen que se ve al cargar (hero o cabecera): la pide
   * primero y sin lazy-load. Todo lo demás se carga al acercarse al viewport.
   */
  prioridad?: boolean
  className?: string
  /** Sustituye el alt del catálogo; pasa '' cuando la foto es decorativa. */
  alt?: string
}

/**
 * Única forma de pintar una foto del catálogo en el sitio público.
 *
 * Pone siempre width/height (reservan el hueco y evitan saltos de layout),
 * srcSet/sizes y la estrategia de carga. Si la foto trae un recorte para
 * móvil, envuelve el <img> en un <picture>; `contents` hace que el <picture>
 * no genere caja propia, así un <img> `absolute inset-0` sigue posicionándose
 * respecto a la sección.
 */
export function Foto({ foto, sizes, prioridad = false, className = '', alt }: FotoProps) {
  const imagen = (
    <img
      src={foto.src}
      srcSet={foto.srcSet}
      sizes={sizes}
      width={foto.ancho}
      height={foto.alto}
      alt={alt ?? foto.alt}
      loading={prioridad ? 'eager' : 'lazy'}
      decoding={prioridad ? 'sync' : 'async'}
      fetchPriority={prioridad ? 'high' : 'auto'}
      className={className}
    />
  )

  if (!foto.srcSetMovil) return imagen

  return (
    <picture className="contents">
      <source media="(max-width: 767px)" srcSet={foto.srcSetMovil} />
      {imagen}
    </picture>
  )
}
