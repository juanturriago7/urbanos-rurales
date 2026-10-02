/**
 * Destino de scroll que centra una tarjeta dentro del carril, acotado a lo
 * que el carril puede desplazarse.
 *
 * `offsetLeft`/`anchoTarjeta` describen la tarjeta y `anchoVisible`/
 * `anchoTotal` el carril (`clientWidth`/`scrollWidth`). Sin acotar, la
 * primera y la última tarjeta pedirían un `scrollLeft` negativo o mayor que
 * el máximo posible, porque el carril nunca llega a desplazarse tanto.
 *
 * La usan tanto `alDeslizar` (para saber qué tarjeta quedó centrada,
 * comparando `scrollLeft` con el destino de cada una) como `irATarjeta` (para
 * desplazarse hasta una tarjeta), de modo que ambos cálculos no diverjan.
 */
export function destinoDeSnap(
  offsetLeft: number,
  anchoTarjeta: number,
  anchoVisible: number,
  anchoTotal: number,
): number {
  const destino = offsetLeft - (anchoVisible - anchoTarjeta) / 2
  const maximo = Math.max(anchoTotal - anchoVisible, 0)
  return Math.min(Math.max(destino, 0), maximo)
}

/**
 * Índice del valor más cercano a `objetivo`.
 *
 * Lo usa el carrusel de inmuebles del home para saber qué punto marcar,
 * comparando `scrollLeft` con el destino de snap de cada tarjeta (ver
 * `destinoDeSnap`). Comparar centros en su lugar falla en tablet: con
 * `sm:basis-[48%]` caben casi dos tarjetas por pantalla y el centro de la
 * segunda queda más cerca que el de la primera y la tercera en casi todo el
 * rango de scroll, así que el punto nunca llegaba a la última tarjeta.
 *
 * Sin elementos devuelve 0. En empate gana el primero.
 */
export function indiceMasCercano(valores: readonly number[], objetivo: number): number {
  let indice = 0
  let menorDistancia = Infinity
  valores.forEach((valor, i) => {
    const distancia = Math.abs(valor - objetivo)
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      indice = i
    }
  })
  return indice
}
