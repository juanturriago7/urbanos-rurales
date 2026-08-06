import { useEffect, useState } from 'react'

/** Devuelve `valor` retrasado `delayMs`, reiniciando el temporizador en cada cambio. */
export function useDebouncedValue<T>(valor: T, delayMs: number): T {
  const [valorDebounced, setValorDebounced] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setValorDebounced(valor), delayMs)
    return () => clearTimeout(id)
  }, [valor, delayMs])

  return valorDebounced
}
