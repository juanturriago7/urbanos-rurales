import { describe, expect, it } from 'vitest'
import { indiceMasCercanoAlCentro } from '@/features/public/properties/lib/carrusel'

describe('indiceMasCercanoAlCentro', () => {
  it('sin elementos devuelve 0', () => {
    expect(indiceMasCercanoAlCentro([], 120)).toBe(0)
  })

  it('con un solo elemento devuelve 0', () => {
    expect(indiceMasCercanoAlCentro([42], 900)).toBe(0)
  })

  it('elige el centro más cercano al centro visible', () => {
    expect(indiceMasCercanoAlCentro([50, 150, 250], 160)).toBe(1)
    expect(indiceMasCercanoAlCentro([50, 150, 250], 240)).toBe(2)
  })

  it('en empate se queda con el primero', () => {
    expect(indiceMasCercanoAlCentro([100, 200], 150)).toBe(0)
  })

  // Carril de 100px, tarjetas de 85px con 16px de separación:
  // centros en 42.5, 143.5 y 244.5; scroll máximo = 287 - 100 = 187.
  it('reconoce la primera y la última tarjeta en los topes del scroll', () => {
    const centros = [42.5, 143.5, 244.5]
    expect(indiceMasCercanoAlCentro(centros, 0 + 50)).toBe(0)
    expect(indiceMasCercanoAlCentro(centros, 93.5 + 50)).toBe(1)
    expect(indiceMasCercanoAlCentro(centros, 187 + 50)).toBe(2)
  })
})
