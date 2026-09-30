import { describe, expect, it } from 'vitest'
import { esRutaFichaInmueble } from '@/shared/lib/rutas'

describe('esRutaFichaInmueble', () => {
  it.each(['/inmuebles/apartamento-chico-123', '/inmuebles/apartamento-chico-123/'])(
    'reconoce la ficha %s',
    (ruta) => {
      expect(esRutaFichaInmueble(ruta)).toBe(true)
    },
  )

  it.each(['/', '/inmuebles', '/inmuebles/', '/inmuebles/a/b', '/proyectos/x', '/admin/properties/3/editar'])(
    'descarta %s',
    (ruta) => {
      expect(esRutaFichaInmueble(ruta)).toBe(false)
    },
  )
})
