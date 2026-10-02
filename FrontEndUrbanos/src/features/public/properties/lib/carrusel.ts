/**
 * Índice del elemento cuyo centro queda más cerca de `centroVisible`.
 *
 * Lo usa el carrusel de inmuebles del home para saber qué punto marcar. Las
 * tarjetas van con `snap-center`, pero la primera y la última nunca llegan a
 * centrarse (el scroll topa antes), así que no basta con dividir `scrollLeft`
 * entre el ancho de la tarjeta: se compara la distancia de cada centro al
 * centro del área visible, todo en coordenadas del carril.
 *
 * Sin elementos devuelve 0. En empate gana el primero.
 */
export function indiceMasCercanoAlCentro(
  centros: readonly number[],
  centroVisible: number,
): number {
  let indice = 0
  let menorDistancia = Infinity
  centros.forEach((centro, i) => {
    const distancia = Math.abs(centro - centroVisible)
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      indice = i
    }
  })
  return indice
}
