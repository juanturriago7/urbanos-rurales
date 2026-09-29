import { describe, expect, it } from 'vitest'
import { normalizarDescripcion } from './descripcion'

describe('normalizarDescripcion', () => {
  it('une los saltos de línea sueltos para que el texto fluya con el contenedor', () => {
    // El caso real: el asesor pega texto de un Word con ancho fijo y cada
    // renglón queda cortado a los ~60 caracteres pase lo que pase.
    const texto = 'Casa campestre de dos plantas ubicada en la\nvereda El Salitre, a 20 minutos del\ncasco urbano.'

    expect(normalizarDescripcion(texto)).toEqual([
      {
        tipo: 'parrafo',
        texto: 'Casa campestre de dos plantas ubicada en la vereda El Salitre, a 20 minutos del casco urbano.',
      },
    ])
  })

  it('separa en párrafos distintos cuando hay una línea en blanco', () => {
    const texto = 'Primer párrafo sobre el inmueble.\n\nSegundo párrafo sobre el sector.'

    expect(normalizarDescripcion(texto)).toEqual([
      { tipo: 'parrafo', texto: 'Primer párrafo sobre el inmueble.' },
      { tipo: 'parrafo', texto: 'Segundo párrafo sobre el sector.' },
    ])
  })

  it('trata los saltos CRLF de Windows igual que los LF', () => {
    const texto = 'Una línea\r\ny su continuación\r\n\r\nOtro párrafo'

    expect(normalizarDescripcion(texto)).toEqual([
      { tipo: 'parrafo', texto: 'Una línea y su continuación' },
      { tipo: 'parrafo', texto: 'Otro párrafo' },
    ])
  })

  it('colapsa varias líneas en blanco seguidas en una sola separación', () => {
    const texto = 'Antes.\n\n\n   \n\nDespués.'

    expect(normalizarDescripcion(texto)).toEqual([
      { tipo: 'parrafo', texto: 'Antes.' },
      { tipo: 'parrafo', texto: 'Después.' },
    ])
  })

  it('colapsa espacios repetidos y recorta los extremos', () => {
    expect(normalizarDescripcion('   Casa    con    patio   ')).toEqual([
      { tipo: 'parrafo', texto: 'Casa con patio' },
    ])
  })

  it('devuelve una lista vacía cuando no hay contenido', () => {
    expect(normalizarDescripcion('')).toEqual([])
    expect(normalizarDescripcion('   \n\n  \r\n ')).toEqual([])
  })

  /* Las descripciones de inmuebles suelen traer viñetas. Unirlas como texto
     corrido las convertiría en un renglón ilegible, peor que el estado actual. */
  it('conserva las viñetas como lista en vez de aplastarlas en un renglón', () => {
    const texto = '- Piscina privada\n- Gimnasio\n- Dos parqueaderos'

    expect(normalizarDescripcion(texto)).toEqual([
      { tipo: 'lista', items: ['Piscina privada', 'Gimnasio', 'Dos parqueaderos'] },
    ])
  })

  it('reconoce viñetas con •, * y numeradas', () => {
    expect(normalizarDescripcion('• Uno\n* Dos\n3. Tres\n4) Cuatro')).toEqual([
      { tipo: 'lista', items: ['Uno', 'Dos', 'Tres', 'Cuatro'] },
    ])
  })

  it('separa la frase introductoria de las viñetas que la siguen', () => {
    const texto = 'El conjunto incluye:\n- Portería 24 horas\n- Salón comunal'

    expect(normalizarDescripcion(texto)).toEqual([
      { tipo: 'parrafo', texto: 'El conjunto incluye:' },
      { tipo: 'lista', items: ['Portería 24 horas', 'Salón comunal'] },
    ])
  })

  it('une los renglones de una viñeta que viene partida en varias líneas', () => {
    const texto = '- Cocina integral con isla\n  y mesón en granito\n- Estudio'

    expect(normalizarDescripcion(texto)).toEqual([
      { tipo: 'lista', items: ['Cocina integral con isla y mesón en granito', 'Estudio'] },
    ])
  })

  it('descarta las viñetas que quedan vacías', () => {
    expect(normalizarDescripcion('- Piscina\n-\n- Gimnasio')).toEqual([
      { tipo: 'lista', items: ['Piscina', 'Gimnasio'] },
    ])
  })

  it('combina párrafos y listas en un texto largo completo', () => {
    const texto = [
      'Apartamento remodelado en el barrio Chicó,',
      'con vista abierta a los cerros.',
      '',
      'Incluye:',
      '- Dos habitaciones',
      '- Cocina integral',
      '',
      'Se entrega disponible de inmediato.',
    ].join('\n')

    expect(normalizarDescripcion(texto)).toEqual([
      {
        tipo: 'parrafo',
        texto: 'Apartamento remodelado en el barrio Chicó, con vista abierta a los cerros.',
      },
      { tipo: 'parrafo', texto: 'Incluye:' },
      { tipo: 'lista', items: ['Dos habitaciones', 'Cocina integral'] },
      { tipo: 'parrafo', texto: 'Se entrega disponible de inmediato.' },
    ])
  })
})
