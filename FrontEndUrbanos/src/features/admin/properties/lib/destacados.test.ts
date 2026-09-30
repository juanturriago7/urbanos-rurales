import { describe, expect, it } from 'vitest'
import {
  MENSAJE_SOLO_PUBLICADOS,
  estadoBotonDestacar,
  mensajeSinCupo,
} from '@/features/admin/properties/lib/destacados'

describe('mensajeSinCupo', () => {
  it('coincide con el texto del backend', () => {
    expect(mensajeSinCupo(3)).toBe('Máximo 3 inmuebles destacados. Quita uno para destacar otro.')
  })
})

describe('estadoBotonDestacar', () => {
  const lleno = { total: 3, maximo: 3 }
  const conCupo = { total: 2, maximo: 3 }

  it('siempre permite quitar un destacado, aunque el cupo esté lleno', () => {
    expect(estadoBotonDestacar({ estado: 'publicado', destacado: true }, lleno)).toEqual({
      deshabilitado: false,
      motivo: null,
    })
  })

  it('permite quitar un destacado heredado de un inmueble no publicado', () => {
    expect(estadoBotonDestacar({ estado: 'pausado', destacado: true }, conCupo)).toEqual({
      deshabilitado: false,
      motivo: null,
    })
  })

  it('bloquea destacar un inmueble no publicado', () => {
    expect(estadoBotonDestacar({ estado: 'borrador', destacado: false }, conCupo)).toEqual({
      deshabilitado: true,
      motivo: MENSAJE_SOLO_PUBLICADOS,
    })
  })

  it('bloquea destacar cuando el cupo está lleno', () => {
    expect(estadoBotonDestacar({ estado: 'publicado', destacado: false }, lleno)).toEqual({
      deshabilitado: true,
      motivo: mensajeSinCupo(3),
    })
  })

  it('permite destacar un publicado con cupo', () => {
    expect(estadoBotonDestacar({ estado: 'publicado', destacado: false }, conCupo)).toEqual({
      deshabilitado: false,
      motivo: null,
    })
  })

  it('no bloquea mientras el resumen no ha cargado (el backend valida igual)', () => {
    expect(estadoBotonDestacar({ estado: 'publicado', destacado: false }, undefined)).toEqual({
      deshabilitado: false,
      motivo: null,
    })
  })
})
