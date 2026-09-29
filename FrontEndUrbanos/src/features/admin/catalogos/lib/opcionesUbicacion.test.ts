import { describe, expect, it } from 'vitest'
import type { UbicacionDto } from '@/features/admin/catalogos/api/catalogosApi'
import {
  construirOpcionesUbicacion,
  esUbicacionFueraDeCatalogo,
  ETIQUETA_UBICACION_FUERA_DE_CATALOGO,
  filtrarOpcionesUbicacion,
  normalizarTexto,
  resolverSeleccionUbicacion,
} from './opcionesUbicacion'

function nodo(
  id: number,
  tipo: UbicacionDto['tipo'],
  nombre: string,
  padreId: number | null,
  hijos: UbicacionDto[] = [],
): UbicacionDto {
  return { id, tipo, nombre, slug: nombre.toLowerCase(), padreId, activo: true, hijos }
}

// Mismo shape que devuelve GET /api/catalogos/ubicaciones: zona → localidad → upz.
// "Centro" va al final a propósito: el test de orden demuestra que un nombre que
// empieza por el término sube por encima de uno que solo lo contiene, aunque en
// el árbol venga después.
const arbol: UbicacionDto[] = [
  nodo(1, 'zona', 'Norte', null, [
    nodo(10, 'localidad', 'Usaquén', 1, [nodo(100, 'upz', 'Los Cedros', 10)]),
    nodo(11, 'localidad', 'Chapinero', 1, [nodo(110, 'upz', 'Chicó Lago', 11)]),
  ]),
  nodo(2, 'zona', 'Sur', null, [nodo(20, 'localidad', 'Kennedy', 2)]),
  nodo(3, 'zona', 'Centro', null),
]

const opciones = construirOpcionesUbicacion(arbol)
const ids = (lista: { id: number }[]) => lista.map((o) => o.id)

describe('normalizarTexto', () => {
  it('quita tildes, pasa a minúsculas y recorta espacios', () => {
    expect(normalizarTexto('  Usaquén ')).toBe('usaquen')
    expect(normalizarTexto('CHICÓ')).toBe('chico')
    expect(normalizarTexto('Engativá — Ñuñoa')).toBe('engativa — nunoa')
  })
})

describe('construirOpcionesUbicacion', () => {
  it('aplana el árbol en orden, con el nombre como etiqueta y tipo + ruta como descripción', () => {
    expect(opciones).toEqual([
      { id: 1, etiqueta: 'Norte', descripcion: 'Zona' },
      { id: 10, etiqueta: 'Usaquén', descripcion: 'Localidad — Norte' },
      { id: 100, etiqueta: 'Los Cedros', descripcion: 'UPZ — Norte › Usaquén' },
      { id: 11, etiqueta: 'Chapinero', descripcion: 'Localidad — Norte' },
      { id: 110, etiqueta: 'Chicó Lago', descripcion: 'UPZ — Norte › Chapinero' },
      { id: 2, etiqueta: 'Sur', descripcion: 'Zona' },
      { id: 20, etiqueta: 'Kennedy', descripcion: 'Localidad — Sur' },
      { id: 3, etiqueta: 'Centro', descripcion: 'Zona' },
    ])
  })

  it('tolera nodos sin la propiedad hijos', () => {
    const sinHijos = [{ ...nodo(5, 'zona', 'Occidente', null), hijos: undefined }]
    expect(construirOpcionesUbicacion(sinHijos as unknown as UbicacionDto[])).toEqual([
      { id: 5, etiqueta: 'Occidente', descripcion: 'Zona' },
    ])
  })
})

describe('filtrarOpcionesUbicacion', () => {
  it('devuelve todas las opciones, en orden, si no hay término', () => {
    expect(filtrarOpcionesUbicacion(opciones, '')).toEqual(opciones)
    expect(filtrarOpcionesUbicacion(opciones, '   ')).toEqual(opciones)
  })

  it('ignora tildes y mayúsculas: "usaquen" y "USAQUÉN" encuentran Usaquén', () => {
    // Los Cedros también sale, detrás, porque su ruta pasa por Usaquén.
    expect(ids(filtrarOpcionesUbicacion(opciones, 'usaquen'))).toEqual([10, 100])
    expect(ids(filtrarOpcionesUbicacion(opciones, 'USAQUÉN'))).toEqual([10, 100])
  })

  it('encuentra por una parte del nombre', () => {
    expect(ids(filtrarOpcionesUbicacion(opciones, 'chico'))).toEqual([110])
  })

  it('pone primero los nombres que coinciden y después los que solo coinciden por la ruta', () => {
    expect(ids(filtrarOpcionesUbicacion(opciones, 'chapinero'))).toEqual([11, 110])
  })

  it('pone primero los nombres que empiezan por el término', () => {
    expect(ids(filtrarOpcionesUbicacion(opciones, 'ce'))).toEqual([3, 100])
  })

  it('devuelve una lista vacía si nada coincide', () => {
    expect(filtrarOpcionesUbicacion(opciones, 'medellin')).toEqual([])
  })
})

describe('resolverSeleccionUbicacion', () => {
  it('devuelve null si no hay valor', () => {
    expect(resolverSeleccionUbicacion(opciones, '')).toBeNull()
    expect(resolverSeleccionUbicacion(opciones, undefined)).toBeNull()
    expect(resolverSeleccionUbicacion(opciones, null)).toBeNull()
    expect(resolverSeleccionUbicacion(opciones, Number.NaN)).toBeNull()
    expect(resolverSeleccionUbicacion(opciones, 0)).toBeNull()
  })

  it('devuelve la opción del árbol cuyo id coincide, venga como número o como string', () => {
    expect(resolverSeleccionUbicacion(opciones, 110)).toEqual({
      id: 110,
      etiqueta: 'Chicó Lago',
      descripcion: 'UPZ — Norte › Chapinero',
    })
    expect(resolverSeleccionUbicacion(opciones, '110')?.id).toBe(110)
  })

  it('conserva un id que no está en el árbol con una etiqueta neutra, sin mostrar el id', () => {
    const seleccion = resolverSeleccionUbicacion(opciones, 999)
    expect(seleccion).toEqual({
      id: 999,
      etiqueta: ETIQUETA_UBICACION_FUERA_DE_CATALOGO,
      descripcion:
        'Está desactivada o no se ofrece en este selector. Se conserva si no la cambias.',
    })
    expect(seleccion?.etiqueta).not.toContain('999')
  })
})

describe('esUbicacionFueraDeCatalogo', () => {
  it('devuelve false si no hay selección', () => {
    expect(esUbicacionFueraDeCatalogo(opciones, null)).toBe(false)
  })

  it('devuelve false si la selección está en el árbol de opciones', () => {
    const seleccion = resolverSeleccionUbicacion(opciones, 110)
    expect(esUbicacionFueraDeCatalogo(opciones, seleccion)).toBe(false)
  })

  it('devuelve true si la selección es la opción sintética fuera de catálogo', () => {
    const seleccion = resolverSeleccionUbicacion(opciones, 999)
    expect(esUbicacionFueraDeCatalogo(opciones, seleccion)).toBe(true)
  })
})
