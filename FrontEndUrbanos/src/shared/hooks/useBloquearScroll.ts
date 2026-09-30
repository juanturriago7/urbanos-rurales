import { useEffect } from 'react'

interface EstiloOverflow {
  overflow: string
}

/**
 * Bloqueo de scroll con contador. Cada componente modal (drawer, modal de
 * visita, lightbox, menú del admin) guardaba y restauraba `overflow` por su
 * cuenta: si dos se solapaban, el que cerraba primero devolvía el scroll con
 * el otro todavía abierto. Aquí solo el primer bloqueo guarda el valor previo
 * y solo el último en liberarse lo restaura.
 */
export function crearBloqueoScroll() {
  let activos = 0
  let previo = ''

  return {
    bloquear(estilo: EstiloOverflow) {
      if (activos === 0) {
        previo = estilo.overflow
        estilo.overflow = 'hidden'
      }
      activos++
    },
    liberar(estilo: EstiloOverflow) {
      if (activos === 0) return
      activos--
      if (activos === 0) estilo.overflow = previo
    },
  }
}

const bloqueoBody = crearBloqueoScroll()

/** Bloquea el scroll del `body` mientras `activo` sea `true`. */
export function useBloquearScroll(activo: boolean) {
  useEffect(() => {
    if (!activo) return
    bloqueoBody.bloquear(document.body.style)
    return () => bloqueoBody.liberar(document.body.style)
  }, [activo])
}
