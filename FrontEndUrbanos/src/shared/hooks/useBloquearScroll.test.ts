import { describe, expect, it } from 'vitest'
import { crearBloqueoScroll } from '@/shared/hooks/useBloquearScroll'

describe('crearBloqueoScroll', () => {
  it('bloquea el scroll y al liberar restaura el valor previo', () => {
    const estilo = { overflow: 'auto' }
    const bloqueo = crearBloqueoScroll()

    bloqueo.bloquear(estilo)
    expect(estilo.overflow).toBe('hidden')

    bloqueo.liberar(estilo)
    expect(estilo.overflow).toBe('auto')
  })

  it('con dos bloqueos anidados solo restaura al liberar el último', () => {
    const estilo = { overflow: '' }
    const bloqueo = crearBloqueoScroll()

    bloqueo.bloquear(estilo)
    bloqueo.bloquear(estilo)
    bloqueo.liberar(estilo)
    expect(estilo.overflow).toBe('hidden')

    bloqueo.liberar(estilo)
    expect(estilo.overflow).toBe('')
  })

  it('liberar sin un bloqueo previo no toca el estilo', () => {
    const estilo = { overflow: 'scroll' }
    const bloqueo = crearBloqueoScroll()

    bloqueo.liberar(estilo)
    expect(estilo.overflow).toBe('scroll')
  })
})
