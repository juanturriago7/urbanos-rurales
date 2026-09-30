import { describe, expect, it } from 'vitest'
import { paginasVisibles } from '@/features/public/properties/lib/paginacion'

describe('paginasVisibles', () => {
  it('sin páginas devuelve una lista vacía', () => {
    expect(paginasVisibles(1, 0)).toEqual([])
  })

  it('con 7 páginas o menos las muestra todas', () => {
    expect(paginasVisibles(1, 1)).toEqual([1])
    expect(paginasVisibles(3, 5)).toEqual([1, 2, 3, 4, 5])
    expect(paginasVisibles(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('cerca del inicio muestra las 5 primeras y la última', () => {
    expect(paginasVisibles(1, 20)).toEqual([1, 2, 3, 4, 5, 'elipsis-fin', 20])
    expect(paginasVisibles(4, 20)).toEqual([1, 2, 3, 4, 5, 'elipsis-fin', 20])
  })

  it('en medio centra la página actual entre dos elipsis', () => {
    expect(paginasVisibles(5, 20)).toEqual([1, 'elipsis-inicio', 4, 5, 6, 'elipsis-fin', 20])
    expect(paginasVisibles(16, 20)).toEqual([1, 'elipsis-inicio', 15, 16, 17, 'elipsis-fin', 20])
  })

  it('cerca del final muestra la primera y las 5 últimas', () => {
    expect(paginasVisibles(17, 20)).toEqual([1, 'elipsis-inicio', 16, 17, 18, 19, 20])
    expect(paginasVisibles(20, 20)).toEqual([1, 'elipsis-inicio', 16, 17, 18, 19, 20])
  })

  it('una página fuera de rango se trata como el extremo más cercano', () => {
    expect(paginasVisibles(99, 20)).toEqual(paginasVisibles(20, 20))
    expect(paginasVisibles(0, 20)).toEqual(paginasVisibles(1, 20))
  })

  it('la página actual siempre aparece', () => {
    for (let actual = 1; actual <= 30; actual++) {
      expect(paginasVisibles(actual, 30)).toContain(actual)
    }
  })
})
