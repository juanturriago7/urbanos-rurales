# Ajustes responsive del home — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** en el teléfono, que Instagram y TikTok vuelvan a verse en la esquina detrás de un botón desplegable, que los encabezados de sección del home salgan centrados, y que el home muestre solo 3 inmuebles en un carrusel deslizable con un botón grande "Ver más inmuebles".

**Architecture:** tres cambios independientes en el frontend público. Solo la lógica pura (el cálculo del punto activo del carrusel) lleva test unitario, porque Vitest corre con `environment: 'node'`, sin DOM, a propósito. Lo visual se verifica con `pnpm build`, `pnpm lint` y capturas de Playwright (`scripts/capturas-responsive.mjs`).

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (utilidades y variantes `max-sm:`, `sm:`, `lg:`), lucide-react, TanStack Query, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-02-responsive-home-design.md`

## Global Constraints

- Todo el trabajo va dentro de `FrontEndUrbanos/`. Los comandos se corren desde ahí, con `pnpm`.
- Formato Prettier: sin punto y coma, comillas simples, comas finales, 100 caracteres de ancho.
- Nombres, comentarios y textos en español.
- Sin librerías nuevas: el carrusel usa scroll-snap nativo de CSS.
- Los tests solo se incluyen si coinciden con `src/**/*.test.ts` (sin `.tsx`, sin DOM).
- Breakpoints de Tailwind: `sm` = 640px, `lg` = 1024px.
- Rama `develop`. Se commitea al final de cada tarea y no se hace push.
- Textos exactos: botón "Ver más inmuebles"; `aria-label` del toggle "Abrir redes sociales" / "Cerrar redes sociales".

## Preparación (antes de la Tarea 1)

La API y el dev server pueden estar apagados. Para las capturas hacen falta:

```bash
# Docker Desktop encendido; desde Backend/
./scripts/dev-setup.ps1
dotnet run --project src/Portal.Api --launch-profile http   # en segundo plano, :5095
# desde FrontEndUrbanos/
pnpm dev                                                    # en segundo plano, :5173
pnpm exec playwright install chromium                       # solo si falta el navegador
```

Las capturas van a una carpeta temporal fuera del repo (por ejemplo, el scratchpad de la sesión), nunca dentro de `FrontEndUrbanos/`.

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/features/public/properties/lib/carrusel.ts` | Crear | Función pura `indiceMasCercanoAlCentro` |
| `src/features/public/properties/lib/carrusel.test.ts` | Crear | Tests de la función |
| `src/features/public/properties/components/PublicacionesDestacadas.tsx` | Reescribir | 3 inmuebles, carrusel con puntos, botón grande, encabezado centrado en móvil |
| `src/features/public/properties/pages/HomePage.tsx` | Modificar | Encabezados de Quiénes somos, Servicios y Contacto centrados en móvil |
| `src/shared/components/RedesFab.tsx` | Reescribir | Toggle de redes en móvil |

---

### Task 1: Función pura del punto activo del carrusel

**Files:**
- Create: `FrontEndUrbanos/src/features/public/properties/lib/carrusel.ts`
- Test: `FrontEndUrbanos/src/features/public/properties/lib/carrusel.test.ts`

**Interfaces:**
- Produces: `export function indiceMasCercanoAlCentro(centros: readonly number[], centroVisible: number): number`. La Task 2 la importa desde `@/features/public/properties/lib/carrusel`.

- [ ] **Step 1: Escribir el test que falla**

`src/features/public/properties/lib/carrusel.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `pnpm test src/features/public/properties/lib/carrusel.test.ts`
Expected: FAIL, porque no puede resolver `@/features/public/properties/lib/carrusel` (el archivo no existe).

- [ ] **Step 3: Implementación mínima**

`src/features/public/properties/lib/carrusel.ts`:

```ts
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
```

- [ ] **Step 4: Correr el test y ver que pasa**

Run: `pnpm test src/features/public/properties/lib/carrusel.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/public/properties/lib/carrusel.ts src/features/public/properties/lib/carrusel.test.ts
git commit -m "feat(web): calculo del punto activo del carrusel de inmuebles"
```

---

### Task 2: Carrusel de 3 inmuebles con botón "Ver más inmuebles"

**Files:**
- Modify (reescritura completa): `FrontEndUrbanos/src/features/public/properties/components/PublicacionesDestacadas.tsx`

**Interfaces:**
- Consumes: `indiceMasCercanoAlCentro` (Task 1); `usePublicaciones(filtro)` de `@/features/public/properties/hooks/usePublicaciones`, que devuelve `{ data?: { items: InmueblePublicoListItemDto[] }, isLoading, isError }`; el tipo `InmueblePublicoListItemDto` de `@/features/public/properties/api/inmueblesPublicApi`.
- Produces: el mismo export `PublicacionesDestacadas()`, sin props. `HomePage.tsx` no cambia su uso.

Notas de diseño para quien implementa:
- El carril es `flex` con scroll horizontal por debajo de `lg` y `grid` de 3 columnas desde `lg`. Lleva `-mx-4 px-4 sm:-mx-6 sm:px-6` para ocupar todo el ancho de la pantalla (el `Container` tiene `px-4 sm:px-6`), y lo revierte con `lg:mx-0 lg:px-0`.
- `py-2` en el carril evita que el `hover:-translate-y-0.5` de la tarjeta se recorte: un `overflow-x-auto` también recorta en vertical.
- `relative` en el carril hace que sea el `offsetParent` de las tarjetas, así que `offsetLeft` y `scrollLeft` quedan en las mismas coordenadas.

- [ ] **Step 1: Reescribir el componente**

Reemplazar el contenido completo de `PublicacionesDestacadas.tsx` por:

```tsx
import { Container } from '@/shared/components/ui/Container'
import { ArrowRight, BedDouble, House, MapPin, Ruler } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { InmueblePublicoListItemDto } from '@/features/public/properties/api/inmueblesPublicApi'
import { usePublicaciones } from '@/features/public/properties/hooks/usePublicaciones'
import { BadgeDestacado } from '@/features/public/properties/components/BadgeDestacado'
import { indiceMasCercanoAlCentro } from '@/features/public/properties/lib/carrusel'

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(precioVenta: number | null, precioArriendo: number | null): {
  texto: string
  operacion: 'Venta' | 'Arriendo' | null
} {
  if (precioVenta !== null) {
    return { texto: formatoPesos.format(precioVenta), operacion: 'Venta' }
  }
  if (precioArriendo !== null) {
    return { texto: `${formatoPesos.format(precioArriendo)}/mes`, operacion: 'Arriendo' }
  }
  return { texto: '—', operacion: null }
}

/** El home es una muestra; el portafolio completo vive en /inmuebles. */
const CANTIDAD = 3

/**
 * Carrusel deslizable con scroll-snap por debajo de `lg`, grilla de 3 desde
 * `lg`. Los márgenes negativos lo llevan hasta el borde de la pantalla para que
 * la tarjeta siguiente asome; `py-2` evita que el desplazamiento del hover se
 * recorte (un `overflow-x-auto` también recorta en vertical) y `relative` hace
 * del carril el `offsetParent` de las tarjetas, para medirlas en las mismas
 * coordenadas que `scrollLeft`.
 */
const CARRIL = [
  'relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-2',
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6',
  'lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0',
].join(' ')

/** Ancho de cada tarjeta dentro del carril: una y algo en móvil, dos en tablet. */
const CELDA = 'shrink-0 basis-[85%] snap-center sm:basis-[48%] lg:basis-auto'

/**
 * Sección de publicaciones en el home — spec 05.
 *
 * Muestra solo 3 inmuebles y remite al portafolio completo con un botón grande
 * al final. Comparte paleta y tipografía con el resto del home.
 *
 * Si no hay publicaciones o la API falla, la sección no se renderiza (mejor
 * ausente que un hueco o un error visible debajo del hero).
 */
export function PublicacionesDestacadas() {
  const { data, isLoading, isError } = usePublicaciones({ pageSize: CANTIDAD })
  const carrilRef = useRef<HTMLDivElement>(null)
  const [activo, setActivo] = useState(0)

  if (isError) return null
  if (!isLoading && (!data || data.items.length === 0)) return null

  const items = data?.items ?? []

  function alDeslizar() {
    const carril = carrilRef.current
    if (!carril) return
    const centros = Array.from(carril.children, (hijo) => {
      const tarjeta = hijo as HTMLElement
      return tarjeta.offsetLeft + tarjeta.offsetWidth / 2
    })
    setActivo(indiceMasCercanoAlCentro(centros, carril.scrollLeft + carril.clientWidth / 2))
  }

  function irATarjeta(indice: number) {
    const carril = carrilRef.current
    const tarjeta = carril?.children[indice] as HTMLElement | undefined
    if (!carril || !tarjeta) return
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    carril.scrollTo({
      left: tarjeta.offsetLeft - (carril.clientWidth - tarjeta.offsetWidth) / 2,
      behavior: sinMovimiento ? 'auto' : 'smooth',
    })
  }

  return (
    <section className="bg-[#eff4f8] py-16 sm:py-24">
      <Container>
        {/* Encabezado: centrado en móvil, a la izquierda desde sm */}
        <div className="reveal mb-10 flex flex-col items-center gap-3 text-center sm:mb-12 sm:items-start sm:text-left">
          <span className="rounded-full bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px]">
            <span className="text-[11px] font-semibold tracking-[1.32px] text-[#004b98] uppercase">
              Publicaciones
            </span>
          </span>
          <h2 className="titulo-seccion text-[#001124]">Inmuebles disponibles</h2>
          <p className="texto-lead max-w-[560px] text-[#7a8187]">
            Nuestras propiedades destacadas y las más recientes del portafolio.
          </p>
        </div>

        {/* Skeletons de carga */}
        {isLoading && (
          <div className={CARRIL}>
            {Array.from({ length: CANTIDAD }).map((_, i) => (
              <div
                key={i}
                className={`${CELDA} animate-pulse overflow-hidden rounded-[18px] border border-[#d8dfe4] bg-white`}
              >
                <div className="bg-[#e0e5e9]" style={{ aspectRatio: '382/286.5' }} />
                <div className="flex flex-col gap-3 p-5">
                  <div className="h-5 w-1/3 rounded bg-[#e0e5e9]" />
                  <div className="h-4 w-3/4 rounded bg-[#e0e5e9]" />
                  <div className="h-3 w-1/2 rounded bg-[#e0e5e9]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            <div
              ref={carrilRef}
              onScroll={alDeslizar}
              className={CARRIL}
              role="region"
              aria-label="Inmuebles disponibles"
            >
              {items.map((inmueble) => (
                <TarjetaPublicacion key={inmueble.id} inmueble={inmueble} className={CELDA} />
              ))}
            </div>

            {/* Puntos: solo donde hay carrusel y si hay más de una tarjeta */}
            {items.length > 1 && (
              <div className="mt-4 flex justify-center gap-2 lg:hidden">
                {items.map((inmueble, i) => (
                  <button
                    key={inmueble.id}
                    type="button"
                    onClick={() => irATarjeta(i)}
                    aria-label={`Ver inmueble ${i + 1} de ${items.length}`}
                    aria-current={i === activo ? 'true' : undefined}
                    className={[
                      'h-2.5 rounded-full transition-all duration-300',
                      i === activo ? 'w-6 bg-[#004b98]' : 'w-2.5 bg-[#c3ccd3]',
                    ].join(' ')}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            to="/inmuebles"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#004b98] px-10 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#003b7a] sm:w-auto"
          >
            Ver más inmuebles
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  )
}

interface TarjetaPublicacionProps {
  inmueble: InmueblePublicoListItemDto
  className?: string
}

/** Tarjeta de inmueble, mismo lenguaje que /inmuebles para consistencia. */
function TarjetaPublicacion({ inmueble, className = '' }: TarjetaPublicacionProps) {
  const { texto: precio, operacion } = formatPrice(inmueble.precioVenta, inmueble.precioArriendo)
  const badgeBg = operacion === 'Arriendo' ? 'bg-[#df500c]' : 'bg-[#00b5c5]'
  const badgeTxt = operacion === 'Arriendo' ? 'text-white' : 'text-[#001124]'

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[18px] border border-[#d8dfe4] bg-white p-px transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,17,36,0.10)] ${className}`}
    >
      <Link to={`/inmuebles/${inmueble.slug}`} className="contents">
        {/* Imagen */}
        <div
          className="relative shrink-0 overflow-hidden rounded-t-[17px]"
          style={{ aspectRatio: '382/286.5' }}
        >
          {inmueble.imagenPortada ? (
            <img
              src={inmueble.imagenPortada}
              alt={inmueble.titulo}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)',
              }}
            >
              <span className="px-4 text-center text-[11px] text-[rgba(255,255,255,0.4)]">
                Sin fotografía disponible
              </span>
            </div>
          )}
          {operacion && (
            <span
              className={`absolute top-3.5 left-3.5 ${badgeBg} ${badgeTxt} rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.33px]`}
            >
              {operacion}
            </span>
          )}
          {inmueble.destacado && <BadgeDestacado />}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 p-5">
          <p className="text-[20px] leading-none font-extrabold tracking-[-0.5px] text-[#004b98]">
            {precio}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug font-bold text-[#001124]">
            {inmueble.titulo}
          </p>
          <div className="flex items-center gap-[5px] pb-2.5 text-[#7a8187]">
            <MapPin className="h-[13px] w-[13px] shrink-0" aria-hidden="true" />
            <span className="truncate text-[13px] text-[#7a8187]">{inmueble.ubicacion}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-[14px] gap-y-1 border-t border-[#e0e5e9] pt-[15px]">
            {inmueble.areaConstruidaM2 && (
              <span className="flex items-center gap-[5px] text-[#7a8187]">
                <Ruler className="h-[13px] w-[13px]" aria-hidden="true" />
                <span className="text-[12px] font-medium text-[#7a8187]">
                  {inmueble.areaConstruidaM2} m²
                </span>
              </span>
            )}
            {inmueble.habitaciones > 0 && (
              <span className="flex items-center gap-[5px] text-[#7a8187]">
                <BedDouble className="h-[13px] w-[13px]" aria-hidden="true" />
                <span className="text-[12px] font-medium text-[#7a8187]">
                  {inmueble.habitaciones} hab
                </span>
              </span>
            )}
            <span className="flex items-center gap-[5px] text-[#7a8187]">
              <House className="h-[13px] w-[13px]" aria-hidden="true" />
              <span className="text-[12px] font-medium text-[#7a8187] capitalize">
                {inmueble.tipoInmueble}
              </span>
            </span>
            {inmueble.estrato && (
              <span className="text-[12px] font-medium text-[#7a8187]">
                Estrato {inmueble.estrato}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
```

Las funciones `alDeslizar` e `irATarjeta` van después de los `return null` tempranos a propósito: son funciones normales, no hooks, y los hooks (`usePublicaciones`, `useRef`, `useState`) quedan todos antes de cualquier `return`.

- [ ] **Step 2: Type-check, lint y tests**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: el build termina sin errores de TypeScript, eslint no reporta problemas y todos los tests pasan.

- [ ] **Step 3: Capturas**

Con la API y `pnpm dev` corriendo (ver Preparación), con `<dir>` igual a una carpeta temporal fuera del repo:

```bash
node scripts/capturas-responsive.mjs --ruta home --anchos 375,768,1440 --esperar 1500 \
  --antes "document.querySelector('[aria-label=\"Inmuebles disponibles\"]')?.scrollIntoView()" \
  --viewport --nombre inmuebles --salida <dir>
```

Expected: código de salida 0 (sin desborde horizontal de la página; el scroll del carril no cuenta porque es interno). Abrir las tres capturas y revisar:
- 375px: encabezado centrado, una tarjeta casi a lo ancho con el borde de la siguiente asomando, 3 puntos (el primero alargado) y botón "Ver más inmuebles" a todo el ancho.
- 768px: dos tarjetas visibles, encabezado a la izquierda y botón centrado de ancho automático.
- 1440px: grilla de 3 sin puntos, botón centrado debajo y sin botón en la cabecera.

- [ ] **Step 4: Comprobar el punto activo al deslizar**

```bash
node scripts/capturas-responsive.mjs --ruta home --anchos 375 --esperar 1500 \
  --antes "const c=document.querySelector('[aria-label=\"Inmuebles disponibles\"]'); c.scrollIntoView(); c.scrollTo({left: c.scrollWidth})" \
  --viewport --nombre inmuebles-final --salida <dir>
```

Expected: la captura muestra la tercera tarjeta y el tercer punto alargado.

- [ ] **Step 5: Commit**

```bash
git add src/features/public/properties/components/PublicacionesDestacadas.tsx
git commit -m "feat(web): home con 3 inmuebles en carrusel y boton Ver mas inmuebles"
```

---

### Task 3: Encabezados de sección del home centrados en móvil

**Files:**
- Modify: `FrontEndUrbanos/src/features/public/properties/pages/HomePage.tsx` (Quiénes somos ~271-276, Servicios ~337-344, Contacto ~489-496)

**Interfaces:**
- Consumes: nada de otras tareas.
- Produces: nada que otras tareas usen.

Solo se tocan la etiqueta (pill) y el `h2`. Los párrafos, la cita, los tags y el formulario siguen a la izquierda. Todo vuelve al diseño actual desde `lg`, que es donde estas secciones se ponen en dos columnas.

- [ ] **Step 1: Quiénes somos**

Aquí el contenedor también envuelve los párrafos, así que se centran la etiqueta y el título uno por uno, sin tocar el contenedor.

Reemplazar:

```tsx
            <div className="reveal self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Quiénes somos</span>
            </div>
            <h2 className="reveal titulo-seccion text-[#001124]">
              Expertos en gestión predial e inmobiliaria
            </h2>
```

por:

```tsx
            <div className="reveal self-center bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full lg:self-start">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Quiénes somos</span>
            </div>
            <h2 className="reveal titulo-seccion text-center text-[#001124] lg:text-left">
              Expertos en gestión predial e inmobiliaria
            </h2>
```

- [ ] **Step 2: Servicios**

Reemplazar:

```tsx
          <div className="reveal flex flex-col gap-3">
            <div className="self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Líneas de Servicio</span>
            </div>
```

por:

```tsx
          <div className="reveal flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Líneas de Servicio</span>
            </div>
```

- [ ] **Step 3: Contacto**

Reemplazar:

```tsx
          <div className="reveal flex flex-col gap-3">
            <div className="self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Contacto</span>
            </div>
```

por:

```tsx
          <div className="reveal flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Contacto</span>
            </div>
```

- [ ] **Step 4: Type-check y lint**

Run: `pnpm build && pnpm lint`
Expected: sin errores.

- [ ] **Step 5: Capturas**

```bash
node scripts/capturas-responsive.mjs --ruta home --anchos 375,1440 --esperar 1500 --salida <dir>
```

Expected: código de salida 0. En la captura completa de 375px, las etiquetas y los títulos de Inmuebles disponibles, Quiénes somos, Servicios, Trayectoria, Clientes, Certificaciones y Contacto están todos centrados, y los párrafos siguen a la izquierda. En 1440px, Quiénes somos, Servicios y Contacto se ven igual que antes, alineados a la izquierda.

- [ ] **Step 6: Commit**

```bash
git add src/features/public/properties/pages/HomePage.tsx
git commit -m "fix(web): encabezados de seccion del home centrados en movil"
```

---

### Task 4: Redes sociales desplegables en móvil

**Files:**
- Modify (reescritura completa): `FrontEndUrbanos/src/shared/components/RedesFab.tsx`

**Interfaces:**
- Consumes: `InstagramIcon` y `TikTokIcon` de `@/shared/components/icons/SocialIcons`, `WhatsAppIcon` de `@/shared/components/icons/WhatsAppIcon` (todos `({ className }: { className?: string }) => JSX.Element`), `site` de `@/shared/config/site`, `esRutaFichaInmueble` de `@/shared/lib/rutas`, y `Share2` y `X` de `lucide-react`.
- Produces: el mismo export `RedesFab()`, sin props, que monta `PublicLayout`. El `id` `redes-fab-lista` y el `aria-controls` del toggle sirven para las capturas.

Notas de diseño para quien implementa:
- Las redes cerradas en móvil llevan `max-sm:invisible`. `visibility: hidden` las saca del tab, del árbol de accesibilidad y de los toques, y se puede limitar a móvil con una clase. Con `inert` no se podría limitar sin una media query en JS.
- El contenedor es `pointer-events-none` y cada botón es `pointer-events-auto`. Así, el hueco que dejan las redes ocultas encima del toggle no bloquea toques sobre el contenido. Durante el retardo inicial, `inert` en el contenedor sigue bloqueando todo, incluidos los hijos `pointer-events-auto`.
- Las redes se cierran al navegar, ajustando el estado durante el render cuando cambia `location.key`. Es el patrón de React para "ajustar estado cuando cambia una prop" y evita el `setState` dentro de un efecto, que `eslint-plugin-react-hooks` v7 marca.

- [ ] **Step 1: Reescribir el componente**

Reemplazar el contenido completo de `RedesFab.tsx` por:

```tsx
import { Share2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { InstagramIcon, TikTokIcon } from '@/shared/components/icons/SocialIcons'
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon'
import { site } from '@/shared/config/site'
import { esRutaFichaInmueble } from '@/shared/lib/rutas'

/**
 * Pila flotante de contacto y redes: Instagram, TikTok y WhatsApp.
 *
 * No aparece de inmediato: espera dos segundos o el primer scroll, lo que
 * ocurra antes, para no competir con el hero en el primer vistazo.
 *
 * En móvil la pila completa medía ~170px de alto y tapaba texto, el envío del
 * formulario y la paginación. Por eso, por debajo de `sm`, Instagram y TikTok
 * quedan plegadas tras un botón de redes y solo WhatsApp está siempre a la
 * vista. Cerrada, la pila mide ~104px.
 */
const RETARDO_MS = 2000

const MENSAJE = 'Hola, vengo del sitio web y quiero información sobre un inmueble.'

const ID_LISTA = 'redes-fab-lista'

interface Enlace {
  etiqueta: string
  aria: string
  href: string
  Icon: ComponentType<{ className?: string }>
  fondo: string
}

const REDES: Enlace[] = [
  {
    etiqueta: 'Síguenos en Instagram',
    aria: 'Abrir el Instagram de Urbanos & Rurales',
    href: site.redes.instagram,
    Icon: InstagramIcon,
    // El degradado es la identidad de Instagram; en plano se leería como un
    // icono genérico al lado de los otros dos, que sí van con su color de marca.
    fondo: 'bg-[linear-gradient(45deg,#F58529_0%,#DD2A7B_45%,#8134AF_75%,#515BD4_100%)]',
  },
  {
    etiqueta: 'Síguenos en TikTok',
    aria: 'Abrir el TikTok de Urbanos & Rurales',
    href: site.redes.tiktok,
    Icon: TikTokIcon,
    fondo: 'bg-[#010101]',
  },
]

/**
 * WhatsApp va último para quedar pegado al borde inferior: es el CTA principal
 * y esa es la esquina que el pulgar alcanza sin estirarse en móvil.
 */
const WHATSAPP: Enlace = {
  etiqueta: 'Respondemos en segundos',
  aria: 'Escribir por WhatsApp',
  href: `https://wa.me/${site.contacto.whatsapp}?text=${encodeURIComponent(MENSAJE)}`,
  Icon: WhatsAppIcon,
  fondo: 'bg-[#25D366]',
}

/** En móvil las redes son más chicas que WhatsApp para no restarle protagonismo. */
const TAMANOS = {
  red: { circulo: 'h-10 w-10 sm:h-14 sm:w-14', icono: 'h-5 w-5 sm:h-7 sm:w-7' },
  principal: { circulo: 'h-12 w-12 sm:h-14 sm:w-14', icono: 'h-6 w-6 sm:h-7 sm:w-7' },
}

export function RedesFab() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  // En la ficha, por debajo de `lg`, la barra fija ya lleva WhatsApp y el FAB
  // se montaría encima de ella.
  const enFicha = esRutaFichaInmueble(location.pathname)

  // Solo tiene efecto por debajo de `sm`: desde ahí las redes siempre se ven.
  const [abiertas, setAbiertas] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)

  // Al navegar se pliegan. Se ajusta durante el render (patrón de React para
  // "ajustar estado cuando cambia una prop") en vez de con un efecto.
  const [ubicacionPrevia, setUbicacionPrevia] = useState(location.key)
  if (location.key !== ubicacionPrevia) {
    setUbicacionPrevia(location.key)
    setAbiertas(false)
  }

  useEffect(() => {
    const temporizador = window.setTimeout(() => setVisible(true), RETARDO_MS)

    function alHacerScroll() {
      setVisible(true)
    }

    window.addEventListener('scroll', alHacerScroll, { passive: true, once: true })

    return () => {
      window.clearTimeout(temporizador)
      window.removeEventListener('scroll', alHacerScroll)
    }
  }, [])

  // Abiertas, se pliegan al tocar fuera o con Escape (devolviendo el foco al
  // botón, para que quien navega con teclado no lo pierda).
  useEffect(() => {
    if (!abiertas) return

    function alTocarFuera(e: PointerEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbiertas(false)
    }

    function alPulsarTecla(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setAbiertas(false)
      botonRef.current?.focus()
    }

    document.addEventListener('pointerdown', alTocarFuera)
    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      document.removeEventListener('pointerdown', alTocarFuera)
      document.removeEventListener('keydown', alPulsarTecla)
    }
  }, [abiertas])

  return (
    <div
      ref={contenedorRef}
      // Mientras es invisible tiene que salir del orden de tabulación y del
      // árbol de accesibilidad. `opacity-0` no lo saca —no es `display` ni
      // `visibility`— y `pointer-events-none` solo gobierna ratón y táctil, no
      // el teclado. Sin esto, quien tabula durante los dos primeros segundos
      // aterriza en enlaces completamente transparentes cuyo anillo de foco
      // también es invisible, que es justo lo que prohíbe WCAG 2.4.7.
      // `inert` cubre foco, árbol de accesibilidad y toques de una sola vez
      // (también para los hijos `pointer-events-auto`); React 19 lo soporta
      // de forma nativa.
      inert={!visible}
      className={[
        // z-30 y no z-50: el drawer movil es z-50 y va antes en el DOM, asi que
        // con ambos al mismo nivel el FAB se pintaba encima del panel modal.
        // La jerarquia queda contenido < FAB < header (z-40) < modal (z-50).
        //
        // `pointer-events-none` siempre: en móvil, las redes plegadas dejan un
        // hueco encima del botón que no debe bloquear toques sobre el
        // contenido. Cada botón reactiva sus eventos con `pointer-events-auto`.
        'pointer-events-none fixed right-6 bottom-6 z-30 flex-col items-end gap-3',
        enFicha ? 'hidden lg:flex' : 'flex',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div
        id={ID_LISTA}
        // Plegadas en móvil: `invisible` (visibility: hidden) las saca del tab,
        // del árbol de accesibilidad y de los toques. A diferencia de `inert`,
        // se limita a móvil con una variante de Tailwind.
        className={[
          'flex flex-col items-end gap-3 transition-[opacity,transform,visibility] duration-200',
          abiertas ? '' : 'max-sm:invisible max-sm:translate-y-2 max-sm:opacity-0',
        ].join(' ')}
      >
        {REDES.map((red) => (
          <EnlaceFab
            key={red.etiqueta}
            enlace={red}
            tamano="red"
            onClick={() => setAbiertas(false)}
          />
        ))}
      </div>

      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbiertas((a) => !a)}
        aria-expanded={abiertas}
        aria-controls={ID_LISTA}
        aria-label={abiertas ? 'Cerrar redes sociales' : 'Abrir redes sociales'}
        className="shadow-dropdown pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#004b98] text-white sm:hidden"
      >
        {abiertas ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Share2 className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      <EnlaceFab enlace={WHATSAPP} tamano="principal" />
    </div>
  )
}

interface EnlaceFabProps {
  enlace: Enlace
  tamano: keyof typeof TAMANOS
  onClick?: () => void
}

function EnlaceFab({ enlace: { etiqueta, aria, href, Icon, fondo }, tamano, onClick }: EnlaceFabProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      onClick={onClick}
      // `items-end` en el contenedor ancla el borde derecho, así que la
      // etiqueta puede aparecer y desaparecer en hover sin mover el círculo.
      className="group pointer-events-auto flex items-center gap-3"
    >
      <span className="rounded-control bg-surface text-text-secondary shadow-dropdown hidden px-3 py-2 text-xs whitespace-nowrap group-hover:block">
        {etiqueta}
      </span>

      <span
        className={[
          'flex items-center justify-center rounded-full',
          'shadow-dropdown transition-transform duration-200 group-hover:scale-110',
          TAMANOS[tamano].circulo,
          fondo,
        ].join(' ')}
      >
        <Icon className={`${TAMANOS[tamano].icono} text-white`} />
      </span>
    </a>
  )
}
```

- [ ] **Step 2: Type-check, lint y tests**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: sin errores. `eslint-plugin-react-hooks` v7 trae la regla `set-state-in-render`, que marca los `setState` incondicionales durante el render. Aquí van dentro del `if (location.key !== ubicacionPrevia)`, que es el patrón permitido. Si la regla salta, revisar que el `if` siga ahí antes de tocar otra cosa.

- [ ] **Step 3: Capturas del FAB cerrado, abierto y en escritorio**

```bash
# Cerrado en móvil
node scripts/capturas-responsive.mjs --ruta home --anchos 375 --esperar 2500 \
  --viewport --nombre fab-cerrado --salida <dir>
# Abierto en móvil
node scripts/capturas-responsive.mjs --ruta home --anchos 375 --esperar 2500 \
  --antes "document.querySelector('[aria-controls=redes-fab-lista]').click()" \
  --viewport --nombre fab-abierto --salida <dir>
# Escritorio
node scripts/capturas-responsive.mjs --ruta home --anchos 1440 --esperar 2500 \
  --viewport --nombre fab-escritorio --salida <dir>
```

Expected:
- `fab-cerrado` (375px): en la esquina inferior derecha, un círculo azul con el ícono de compartir encima del verde de WhatsApp, sin Instagram ni TikTok.
- `fab-abierto` (375px): Instagram (degradado) y TikTok (negro) encima del botón, que ahora muestra una ✕.
- `fab-escritorio` (1440px): Instagram, TikTok y WhatsApp como antes, sin el botón azul.

- [ ] **Step 4: Comprobar el cierre al tocar fuera y con Escape**

Desde `FrontEndUrbanos/`, crear el script `<dir>/fab-interaccion.mjs` fuera del repo y correrlo con `node`. Para que resuelva `playwright`, se importa con ruta absoluta al `node_modules` del proyecto:

```js
import { chromium } from 'file:///D:/Programacion/urbanos-rurales/urbanos-rurales-dev-branch/urbanos-rurales/FrontEndUrbanos/node_modules/playwright/index.mjs'

const navegador = await chromium.launch()
const pagina = await navegador.newPage({ viewport: { width: 375, height: 800 }, hasTouch: true })
await pagina.goto('http://localhost:5173/')
await pagina.waitForTimeout(2500)
const boton = pagina.locator('[aria-controls=redes-fab-lista]')
const ig = pagina.getByLabel('Abrir el Instagram de Urbanos & Rurales')

const r = {}
r.inicialOculta = !(await ig.isVisible())
await boton.click()
await pagina.waitForTimeout(300)
r.abreAlTocar = (await ig.isVisible()) && (await boton.getAttribute('aria-expanded')) === 'true'
// Toque fuera: pointerdown directo sobre body, para no caer sobre un enlace y navegar.
await pagina.evaluate(() =>
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
)
await pagina.waitForTimeout(300)
r.cierraAlTocarFuera = !(await ig.isVisible())
await boton.click()
await pagina.waitForTimeout(300)
await pagina.keyboard.press('Escape')
await pagina.waitForTimeout(300)
r.cierraConEscape = !(await ig.isVisible())
r.focoVuelveAlBoton = await boton.evaluate((b) => document.activeElement === b)
console.log(r)
await navegador.close()
process.exit(Object.values(r).every(Boolean) ? 0 : 1)
```

Run: `node <dir>/fab-interaccion.mjs`
Expected: imprime los cinco valores en `true` y sale con código 0.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/RedesFab.tsx
git commit -m "feat(web): redes sociales desplegables en el FAB movil"
```

---

### Task 5: Verificación final

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Suite completa**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: todo en verde.

- [ ] **Step 2: Desborde en todos los anchos**

```bash
node scripts/capturas-responsive.mjs --ruta home --esperar 1500 --salida <dir>
node scripts/capturas-responsive.mjs --ruta inmuebles --anchos 375,1440 --esperar 1500 --salida <dir>
```

Expected: código de salida 0 en las dos corridas (sin desborde horizontal en 320–1440px). Revisar la captura de 320px del home: el carrusel, el botón y el FAB no se montan sobre el contenido de forma rara.

- [ ] **Step 3: Ficha de inmueble sin regresión**

```bash
node scripts/capturas-responsive.mjs --ruta "inmuebles/<slug-de-un-inmueble-publicado>" --anchos 375,1440 \
  --esperar 2500 --viewport --nombre ficha --salida <dir>
```

El slug sale de `curl -s "http://localhost:5095/api/inmuebles?page_size=1"` (campo `slug` del primer item).
Expected: en 375px no aparece el FAB, solo la barra fija de la ficha; en 1440px aparece la pila completa de tres.
