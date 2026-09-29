import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/**
 * Recorta un bloque de texto largo y ofrece "Ver más".
 *
 * El botón solo aparece si el contenido de verdad desborda: una descripción de
 * dos frases se pinta entera y sin botón. Para saberlo se mide la altura
 * natural del contenido, no la del contenedor recortado — si se midiera el
 * contenedor, al expandirlo dejaría de desbordar y el botón desaparecería.
 *
 * No se usa `line-clamp-N` porque solo recorta un bloque, y aquí dentro va
 * varios <p> y <ul>.
 */
interface TextoColapsableProps {
  children: ReactNode
  /** Alto visible mientras está contraído, en píxeles. */
  alturaColapsada?: number
  /** Fondo sobre el que se dibuja el degradado de desvanecido. */
  colorFondo?: string
  className?: string
}

export function TextoColapsable({
  children,
  alturaColapsada = 220,
  colorFondo = '#ffffff',
  className = '',
}: TextoColapsableProps) {
  const [abierto, setAbierto] = useState(false)
  const [desborda, setDesborda] = useState(false)
  const contenidoRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    const el = contenidoRef.current
    if (!el) return

    // El observer dispara una primera vez al observar, así que cubre tanto la
    // medición inicial como los cambios de ancho (girar el móvil, cargar la
    // tipografía, expandir el texto).
    const observer = new ResizeObserver(() => {
      setDesborda(el.scrollHeight > alturaColapsada + 8)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [alturaColapsada])

  const recortado = desborda && !abierto

  return (
    <div className={className}>
      <div
        id={id}
        className="relative overflow-hidden"
        style={{ maxHeight: recortado ? alturaColapsada : undefined }}
      >
        <div ref={contenidoRef}>{children}</div>

        {recortado && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
            style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${colorFondo})` }}
            aria-hidden="true"
          />
        )}
      </div>

      {desborda && (
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls={id}
          className="mt-3 rounded-[8px] text-[13px] font-semibold text-[#004b98] transition-colors hover:text-[#00b5c5]"
        >
          {abierto ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  )
}
