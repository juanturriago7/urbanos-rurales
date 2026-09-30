import { describe, expect, it } from 'vitest'
import { FOTOS } from '@/assets/fotos'

const entradas = Object.entries(FOTOS)

describe('catálogo de fotos del sitio público', () => {
  it('no está vacío', () => {
    expect(entradas.length).toBeGreaterThan(0)
  })

  it.each(entradas)('%s tiene un alt descriptivo', (_, foto) => {
    // Un alt de una o dos palabras ("foto", "equipo") no describe nada.
    expect(foto.alt.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4)
  })

  it.each(entradas)('%s declara dimensiones positivas', (_, foto) => {
    expect(foto.ancho).toBeGreaterThan(0)
    expect(foto.alto).toBeGreaterThan(0)
  })

  it.each(entradas)('%s incluye su src dentro del srcSet con descriptores w', (_, foto) => {
    expect(foto.srcSet).toContain(foto.src)
    for (const parte of foto.srcSet.split(',')) {
      expect(parte.trim()).toMatch(/\s\d+w$/)
    }
  })

  it('la portada de artículos no usa el recorte vertical del hero', () => {
    // En una tarjeta horizontal, el recorte 3:4 de móvil se vería deformado.
    expect(FOTOS.portadaArticulo.srcSetMovil).toBeUndefined()
  })
})
