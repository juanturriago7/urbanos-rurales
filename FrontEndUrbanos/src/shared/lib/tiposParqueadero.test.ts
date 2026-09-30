import { describe, expect, it } from 'vitest'
import {
  ETIQUETAS_TIPO_PARQUEADERO,
  TIPOS_PARQUEADERO,
  describirTiposParqueadero,
  hayParqueaderos,
  normalizarTiposParqueadero,
  textoParqueaderos,
} from '@/shared/lib/tiposParqueadero'

describe('TIPOS_PARQUEADERO y etiquetas', () => {
  it('tiene los tres valores del contrato, en orden canónico', () => {
    expect(TIPOS_PARQUEADERO).toEqual(['privado', 'privado_uso_exclusivo', 'doble'])
  })

  it('usa las etiquetas acordadas con el cliente', () => {
    expect(ETIQUETAS_TIPO_PARQUEADERO).toEqual({
      privado: 'Privado',
      privado_uso_exclusivo: 'Privado de uso exclusivo',
      doble: 'Doble (2 en línea)',
    })
  })
})

describe('normalizarTiposParqueadero', () => {
  it('ordena como TIPOS_PARQUEADERO y quita repetidos', () => {
    expect(normalizarTiposParqueadero(2, ['doble', 'privado', 'doble'])).toEqual([
      'privado',
      'doble',
    ])
  })

  it('descarta valores desconocidos', () => {
    expect(normalizarTiposParqueadero(1, ['privado', 'otro'])).toEqual(['privado'])
  })

  it.each([0, -1, Number.NaN])('sin parqueaderos (%s) no hay tipos', (n) => {
    expect(normalizarTiposParqueadero(n, ['privado'])).toEqual([])
  })

  it('tolera null o undefined (respuesta de una API anterior)', () => {
    expect(normalizarTiposParqueadero(1, undefined)).toEqual([])
    expect(normalizarTiposParqueadero(1, null)).toEqual([])
  })
})

describe('describirTiposParqueadero', () => {
  it('une las etiquetas en orden canónico', () => {
    expect(describirTiposParqueadero(['doble', 'privado'])).toBe('Privado, Doble (2 en línea)')
  })

  it('devuelve cadena vacía sin tipos', () => {
    expect(describirTiposParqueadero([])).toBe('')
    expect(describirTiposParqueadero(undefined)).toBe('')
  })
})

describe('textoParqueaderos', () => {
  it('singular para 1 y sin tipos', () => {
    expect(textoParqueaderos(1, [])).toBe('1 parqueadero')
  })

  it('plural, con los tipos tras un punto medio', () => {
    expect(textoParqueaderos(2, ['privado', 'doble'])).toBe(
      '2 parqueaderos · Privado, Doble (2 en línea)',
    )
  })

  it('un solo tipo', () => {
    expect(textoParqueaderos(1, ['privado_uso_exclusivo'])).toBe(
      '1 parqueadero · Privado de uso exclusivo',
    )
  })
})

describe('hayParqueaderos', () => {
  it.each([
    [1, true],
    ['2', true],
    [0, false],
    ['0', false],
    ['', false],
    [null, false],
    [undefined, false],
    ['abc', false],
  ])('%j → %s', (valor, esperado) => {
    expect(hayParqueaderos(valor)).toBe(esperado)
  })
})
