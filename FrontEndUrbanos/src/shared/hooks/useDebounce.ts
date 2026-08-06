import { useEffect, useState } from 'react'

/**
 * Retrasa la actualización de `valor` hasta que pasen `delay` ms sin cambios.
 * Úsalo para evitar peticiones en cada pulsación de teclado.
 *
 * @example
 * const debouncedQ = useDebounce(textoBuscador, 400)
 * // debouncedQ solo cambia 400ms después de que el usuario deja de escribir
 */
export function useDebounce<T>(valor: T, delay = 400): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor)

  useEffect(() => {
    const id = setTimeout(() => setValorDebounced(valor), delay)
    return () => clearTimeout(id)
  }, [valor, delay])

  return valorDebounced
}
