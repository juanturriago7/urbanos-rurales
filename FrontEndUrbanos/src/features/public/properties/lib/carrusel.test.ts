import { describe, expect, it } from 'vitest'
import { destinoDeSnap, indiceMasCercano } from '@/features/public/properties/lib/carrusel'

describe('destinoDeSnap', () => {
  // Carril de 100px, tarjetas de 85px con 16px de separación (una tarjeta y
  // algo por pantalla, geometría de móvil): offsetLeft en 0, 101 y 202;
  // ancho total 287, scroll máximo = 287 - 100 = 187.
  it('centra cada tarjeta, acotado a los topes del carril (móvil)', () => {
    expect(destinoDeSnap(0, 85, 100, 287)).toBe(0) // -7.5 -> 0
    expect(destinoDeSnap(101, 85, 100, 287)).toBe(93.5)
    expect(destinoDeSnap(202, 85, 100, 287)).toBe(187) // 194.5 -> 187
  })

  // Carril de 768px, tarjetas al 48% (368.64px) con 16px de separación (dos
  // tarjetas por pantalla, geometría de tablet): offsetLeft en 0, 384.64 y
  // 769.28; ancho total 1137.92, scroll máximo = 1137.92 - 768 = 369.92.
  it('centra cada tarjeta, acotado a los topes del carril (tablet)', () => {
    expect(destinoDeSnap(0, 368.64, 768, 1137.92)).toBe(0)
    expect(destinoDeSnap(384.64, 368.64, 768, 1137.92)).toBeCloseTo(184.96)
    expect(destinoDeSnap(769.28, 368.64, 768, 1137.92)).toBeCloseTo(369.92) // 569.6 -> 369.92
  })
})

describe('indiceMasCercano', () => {
  it('sin elementos devuelve 0', () => {
    expect(indiceMasCercano([], 120)).toBe(0)
  })

  it('con un solo elemento devuelve 0', () => {
    expect(indiceMasCercano([42], 900)).toBe(0)
  })

  it('elige el valor más cercano al objetivo', () => {
    expect(indiceMasCercano([50, 150, 250], 160)).toBe(1)
    expect(indiceMasCercano([50, 150, 250], 240)).toBe(2)
  })

  it('en empate se queda con el primero', () => {
    expect(indiceMasCercano([100, 200], 150)).toBe(0)
  })

  // Carril de 100px, tarjetas de 85px (móvil): destinos de snap en 0, 93.5 y
  // 187 (ver destinoDeSnap).
  it('reconoce la primera y la última tarjeta en los topes del scroll (móvil)', () => {
    const destinos = [0, 93.5, 187]
    expect(indiceMasCercano(destinos, 0)).toBe(0)
    expect(indiceMasCercano(destinos, 93.5)).toBe(1)
    expect(indiceMasCercano(destinos, 187)).toBe(2)
  })

  // [Important 1] Carril de 768px (tablet) con dos tarjetas por pantalla
  // (sm:basis-[48%]): destinos de snap en 0, 184.96 y 369.92 (ver
  // destinoDeSnap). Con el enfoque viejo de comparar centros (184.32, 568.96
  // y 953.6 contra el centro visible), la tarjeta 2 ganaba en todo el rango y
  // la 3 nunca se activaba — ver el caso [BUG conocido] que queda en el
  // historial de este archivo como evidencia del RED.
  it('reconoce las tres tarjetas en tablet con dos por pantalla', () => {
    const destinos = [0, 184.96, 369.92]
    expect(indiceMasCercano(destinos, 0)).toBe(0)
    expect(indiceMasCercano(destinos, 184.96)).toBe(1)
    expect(indiceMasCercano(destinos, 369.92)).toBe(2)
  })
})
