# Ajustes responsive del home — diseño

Fecha: 2026-10-02 · Alcance: solo frontend público (`FrontEndUrbanos/`).

Tres cambios pedidos por el usuario tras revisar el sitio en el teléfono.

## 1. Redes sociales en el teléfono — `src/shared/components/RedesFab.tsx`

**Problema:** por debajo de `sm` (640px) Instagram y TikTok están ocultos
(`soloDesdeSm`). Se ocultaron porque la pila de tres círculos (~170px) tapaba
texto, el envío del formulario y la paginación. El usuario quiere verlos.

**Diseño:**

- Desde `sm` no cambia nada: pila de Instagram, TikTok y WhatsApp como hoy.
- Por debajo de `sm`:
  - WhatsApp sigue abajo, pegado al borde (CTA principal, zona del pulgar).
  - Encima va un botón "redes" de 40px (fondo `#004b98`, ícono `Share2` de
    lucide) con `aria-expanded` y `aria-controls`, y con `aria-label` "Abrir
    redes sociales" o "Cerrar redes sociales" según el estado.
  - Al tocarlo se despliegan Instagram y TikTok (círculos de 40px) por encima
    del botón, con una transición de opacidad y desplazamiento. El ícono cambia
    a `X` mientras están abiertas.
  - Las redes se cierran al tocar fuera, al pulsar `Escape` (el foco vuelve
    al botón solo si estaba dentro del FAB), al tocar cualquiera de los
    enlaces (incluido WhatsApp) o al cambiar de ruta.
  - En el DOM el botón va antes de la lista, para que al tabular desde él se
    llegue a las redes recién abiertas. El orden visual en móvil (redes,
    botón, WhatsApp) se logra con `max-sm:-order-1` en la lista.
  - Mientras están cerradas, las redes llevan `visibility: hidden`
    (`max-sm:invisible`), que las saca del orden de tabulación, del árbol de
    accesibilidad y de los toques. A diferencia de `inert`, se puede limitar a
    móvil con una clase y no necesita una media query en JS. El contenedor
    pasa a `pointer-events-none` con los botones en `pointer-events-auto`, para
    que el hueco que dejan las redes ocultas no bloquee toques sobre el
    contenido de debajo.
- El retardo inicial de 2 segundos o primer scroll aplica a todo el FAB, igual
  que hoy.
- En la ficha de inmueble el FAB sigue oculto por debajo de `lg`, como hoy.

Cerrado, el FAB en el teléfono mide unos 104px de alto (40 + 12 de separación
+ 48 de WhatsApp + sombra), contra los ~170px de la pila completa que se
descartó.

## 2. Títulos de sección centrados en el teléfono

**Problema:** en el home conviven títulos centrados (Trayectoria, Clientes,
Certificaciones) con títulos alineados a la izquierda (Inmuebles disponibles,
Quiénes somos, Servicios, Contacto). En el teléfono, la mezcla se ve
descuadrada.

**Diseño:** solo se centra el encabezado de cada sección (etiqueta tipo
"pill" + `h2`). Párrafos, citas, formularios y tarjetas se quedan alineados a
la izquierda, porque el texto largo centrado se lee mal.

| Sección | Archivo | En el teléfono | Vuelve al diseño actual desde |
|---|---|---|---|
| Inmuebles disponibles | `PublicacionesDestacadas.tsx` | etiqueta, `h2` y subtítulo centrados | `sm` |
| Quiénes somos | `HomePage.tsx` | etiqueta y `h2` centrados | `lg` (va al lado de la foto) |
| Lo que hacemos por su proyecto | `HomePage.tsx` | etiqueta y `h2` centrados | `lg` |
| Hablemos de su proyecto | `HomePage.tsx` | etiqueta y `h2` centrados | `lg` |

Técnica: `items-center text-center` en el contenedor y `self-center` en la
etiqueta, revertidos con `lg:items-start lg:text-left lg:self-start` (o con
`sm:` en el caso de Inmuebles).

## 3. Inmuebles del home — `src/features/public/properties/components/PublicacionesDestacadas.tsx`

**Problema:** el home pide 6 publicaciones y las muestra todas en grilla.

**Diseño:**

- `usePublicaciones({ pageSize: 3 })`.
- Desde `lg`: grilla de 3 columnas, como hoy.
- Por debajo de `lg`: carrusel deslizable con scroll-snap nativo de CSS
  (`flex overflow-x-auto snap-x snap-mandatory`, sin librerías).
  - Cada tarjeta mide ~85% del ancho (`basis-[85%]`; `sm:basis-[48%]` en
    tablet) y queda centrada con `snap-center`. El borde de la siguiente
    tarjeta asoma para indicar que se puede deslizar.
  - La barra de scroll va oculta.
  - Debajo del carrusel van puntos indicadores, uno por tarjeta. El punto
    activo se recalcula en cada evento `scroll` del carril: es la tarjeta
    cuyo destino de snap (la posición de scroll que la centra, acotada al
    rango de scroll) queda más cerca de `scrollLeft`. Lo calculan las
    funciones puras `destinoDeSnap` e `indiceMasCercano` de
    `lib/carrusel.ts`, que tienen test (los tests del proyecto corren sin
    DOM). Comparar centros en su lugar falla en tablet: con dos tarjetas por
    pantalla, la del medio queda siempre más cerca del centro. Tocar un punto
    desplaza el carril hasta el destino de su tarjeta, con la misma función,
    usando `scrollTo` sobre el carril y no `scrollIntoView`, para no mover la
    página en vertical. Cada punto tiene un área táctil de 24px. Los puntos
    se ocultan desde `lg`, y desde `sm` si hay 2 inmuebles o menos (caben
    todos y el carril no se desliza).
- El render de la tarjeta se extrae a un componente local `TarjetaPublicacion`
  dentro del mismo archivo, para usarlo igual en la grilla y en el carrusel.
- Botón grande debajo: "Ver más inmuebles →" (`Link` a `/inmuebles`), con el
  estilo del botón primario (`bg-[#004b98]`, `font-bold`, `py-4`, `px-10`,
  `rounded-[10px]`). Ocupa el ancho completo en el teléfono y va centrado
  desde `sm`.
- Se quita el botón "Ver todas las propiedades →" de la cabecera, porque el
  nuevo botón lo reemplaza.
- Los skeletons de carga pasan a ser 3, con el mismo carrusel y la misma
  grilla.
- Con 0 publicaciones o con error de la API, la sección no se renderiza, igual
  que hoy. Con menos de 3 publicaciones, el carrusel muestra las que haya y
  los puntos se ajustan a esa cantidad.

## Fuera de alcance

- La página `/inmuebles` y otras páginas públicas.
- La API: `pageSize` ya es un parámetro del endpoint público.

## Verificación

- `pnpm build` y `pnpm lint` sin errores.
- Capturas a 375px, 768px y 1440px con `scripts/capturas-responsive.mjs`
  (Playwright), revisando: el FAB cerrado y abierto en el teléfono, los
  encabezados centrados, el carrusel con la tarjeta siguiente asomando y los
  puntos, y la grilla de 3 en escritorio.
- Interacción en el teléfono: abrir y cerrar las redes (toque, toque fuera,
  Escape) y deslizar el carrusel actualizando el punto activo.
