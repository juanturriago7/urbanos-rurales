# Design system + shell público — Diseño

**Fecha:** 2026-08-05
**Sub-proyecto:** 1 de 5
**Proyecto:** Portal Urbanos (INM-WEB-001)

---

## 1. Contexto

Urbanos & Rurales S.A.S quiere una aplicación nueva que sea, en orden de prioridad:

1. **Un marketplace de publicaciones inmobiliarias** gestionadas por la inmobiliaria, estilo Fincaraíz/MercadoLibre, **con foco en arrendamientos**.
2. **Una landing page corporativa**, secundaria. El sitio es híbrido.

El punto de partida es un documento de diseño UX/UI que describe un lenguaje visual editorial premium (paleta verde petróleo, Playfair Display + Inter, sin gradientes, sin tema oscuro, espaciado generoso), estructurado como clon de la landing de Mubrick Inmobiliaria.

El código actual tiene `PublicLayout` y `HomePage` como placeholders, y un `index.css` con tokens Tailwind v4 en una paleta azul (`brand-50…900`) que ya usan el panel admin, `Button`, `Field` y el 404.

### Decisión de descomposición

"Rediseñar todo el sitio, incluido el admin" no cabe en un spec. Se descompone en cinco sub-proyectos, cada uno con su ciclo spec → plan → implementación:

| # | Sub-proyecto | Depende de |
|---|---|---|
| **1** | **Design system + shell público** ← este documento | — |
| 2 | Marketplace de arriendos (listado, filtros, orden, paginación) | 1 |
| 3 | Landing page | 1 |
| 4 | Ficha de detalle + páginas institucionales | 1, 2 |
| 5 | Re-skin del panel administrativo | 1 |

El orden 2↔3 se invirtió respecto de la propuesta inicial: el marketplace va antes que la landing porque es la prioridad declarada.

### Hallazgo que condicionó el diseño

El documento de diseño describe una empresa que no es esta. Es un clon estructural de Mubrick: corretaje residencial puro, comisión del 3% en venta y un canon en arriendo, oficinas en Bogotá y Medellín, testimonios de particulares, logos de El Tiempo/Portafolio/Fedelonjas y de portales como Fincaraíz/Metro Cuadrado/LaHaus.

Ninguno de esos datos corresponde a Urbanos & Rurales. Los datos reales, extraídos de urbanosrurales.com, son:

- **Razón social:** URBANOS & RURALES S.A.S
- **Lema:** "Conocemos el territorio para viabilizar sus proyectos"
- **Fundación:** 1996
- **Perfil:** consultoría predial para sector público y privado; equipo interdisciplinario (ingenieros, arquitectos, abogados, trabajadores sociales, economistas); certificaciones ISO 9001 e ISO 14001
- **Líneas de servicio:** Topografía, Gestión Predial Integral, Consultoría y Asesorías, Avalúos, Comercialización de Inmuebles
- **Visión declarada:** "Para el 2026 seremos una de las empresas líderes en consultoría y asesorías en gestión predial y servicios inmobiliarios"

**Ningún dato de marketing no verificado entra al código.** Ver sección 9.

---

## 2. Alcance de este sub-proyecto

Dentro:

- Tokens de diseño en `src/index.css`
- Carga de tipografías
- Primitivos de UI reutilizables
- `PublicLayout`: header, drawer móvil, footer, botón flotante de WhatsApp
- `shared/config/site.ts` con los datos de la empresa

Fuera:

- Cualquier sección de contenido de la landing (sub-proyecto 3)
- Listado, filtros y ficha (sub-proyectos 2 y 4)
- Panel admin (sub-proyecto 5), que solo cambia de color por herencia de tokens
- Añadir un test runner al proyecto — decisión aparte

---

## 3. Los dos niveles de densidad

Es la decisión estructural de este sub-proyecto.

El documento pide un lenguaje editorial de lujo: Playfair Display a 64px, 96px de separación entre secciones, "el whitespace es parte del diseño premium", inspiración Sotheby's. Un marketplace estilo Fincaraíz necesita lo contrario: cards compactas en grid, filtros siempre visibles, máximo de publicaciones por pantalla. Aplicar la escala editorial a un listado de arriendos daría tres inmuebles por scroll.

Se resuelve con **un solo sistema de tokens y dos escalas de densidad**:

| | Editorial | Utilidad |
|---|---|---|
| Titular principal | Playfair Display 64px / 42px móvil | Inter 28px / 24px móvil |
| Padding vertical de sección | 96px | 32px |
| Padding de card | 32px | 16px |
| Ancho de contenedor | 1200px | 1440px |
| Rejilla | 1–2 columnas | 3–4 columnas |

**Compartido entre ambas:** paleta completa, radios, sombras, estados de foco, botones, inputs.

**Superficies editoriales:** landing, quiénes somos, páginas legales.
**Superficies de utilidad:** listado, filtros, ficha de inmueble, panel admin.

La densidad **no** se implementa como utilidades custom de Tailwind, sino como dos componentes — `<Section density>` y `<Container width>` (sección 6). El nivel queda explícito al leer el JSX, sin convenciones que haya que memorizar.

---

## 4. Tokens (`src/index.css`)

Todos los colores son sólidos. No hay gradientes en ninguna parte del sistema. No hay tema oscuro; las únicas superficies oscuras son el footer y el overlay del hero.

### 4.1 Estrategia de migración

La escala verde se escribe **sobre los nombres `brand-*` existentes**. El panel admin, `Button`, `Field` y el 404 cambian de azul a verde sin tocar una sola clase. Los tonos 50–500 y 700–900 se derivan de `#0D6E6E`, que es el único valor que fija el documento.

Por la misma razón se conserva el nombre `surface-muted` en lugar de introducir `surface-alt`: `Button` y `Field` ya dependen de él (`hover:bg-surface-muted`, `disabled:bg-surface-muted`), y renombrarlo los rompería sin ganancia.

### 4.2 Valores

```css
@theme {
  /* Marca — escala derivada de #0D6E6E */
  --color-brand-50:  #F0F7F7;
  --color-brand-100: #D6E9E9;
  --color-brand-200: #ADD3D3;
  --color-brand-300: #6FB3B3;
  --color-brand-400: #3A9090;
  --color-brand-500: #1A7E7E;
  --color-brand-600: #0D6E6E;   /* acento principal del documento */
  --color-brand-700: #0A5757;   /* hover */
  --color-brand-800: #084545;
  --color-brand-900: #063535;

  /* Acento secundario */
  --color-accent-gold:       #B8960C;
  --color-accent-gold-hover: #9A7D0A;

  /* Superficies */
  --color-surface:        #FFFFFF;
  --color-surface-muted:  #F5F6FA;   /* nombre conservado, valor nuevo */
  --color-surface-card:   #FAFAF8;
  --color-surface-dark:   #1C1C1E;   /* footer */
  --color-surface-darker: #111111;   /* barra legal del footer */

  /* Texto */
  --color-text-primary:   #1C1C1E;
  --color-text-secondary: #4A4A4A;
  --color-text-tertiary:  #6B6B6B;
  --color-text-disabled:  #9A9A9A;
  --color-text-inverse:   #FFFFFF;
  --color-text-muted-inverse: #AAAAAA;  /* links del footer */

  --color-border: #E2E2E2;

  /* Semánticos */
  --color-error:   #D32F2F;
  --color-success: #388E3C;
  --color-warning: #F59E0B;
  --color-info:    #0D6E6E;

  /* Tipografía */
  --font-sans:  'Inter Variable', 'Inter', system-ui, sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;

  /* Radios */
  --radius-control: 4px;   /* botones, inputs, imágenes */
  --radius-card:    8px;

  /* Sombras */
  --shadow-card:       0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 12px 32px rgba(0, 0, 0, 0.08);
  --shadow-dropdown:   0 8px 24px rgba(0, 0, 0, 0.06);
  --shadow-header:     0 1px 0 rgba(0, 0, 0, 0.05);
}
```

`--color-warning` no aparece en el documento; se conserva el valor actual porque el admin lo usa.

### 4.3 Estilos base

Fuera del bloque `@theme`:

- `body`: `--font-sans`, 16px, `line-height: 1.6`, color `text-primary`, fondo `surface`
- `:focus-visible` global: `outline: 2px solid var(--color-brand-600); outline-offset: 2px`
- `@media (prefers-reduced-motion: reduce)`: `transition-duration: 0.01ms` y `animation-duration: 0.01ms` en todo

---

## 5. Tipografía

Self-hosted vía Fontsource, importadas en `src/main.tsx` antes de `./index.css`:

```
pnpm add @fontsource-variable/inter @fontsource/playfair-display
```

```ts
import '@fontsource-variable/inter'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
```

Solo los pesos 600 y 700 de Playfair: son los únicos que usa la escala tipográfica del documento (H1 700, H2 600). Inter se carga como fuente variable, un solo archivo para todos los pesos.

Se descarta Google Fonts con `preconnect` (lo que sugería la sección 7 del documento): Vite empaqueta las fuentes con hash y las sirve desde el mismo origen, lo que elimina dos conexiones a terceros del critical path y mejora el LCP.

**Playfair Display se usa exclusivamente en superficies editoriales.** El marketplace es Inter en toda su jerarquía.

---

## 6. Primitivos (`src/shared/components/ui/`)

### 6.1 `Button` — modificar

Se conserva la API actual (`variant`, `size`, `isLoading`, `forwardRef`) y se cambia:

- Radio `rounded-lg` (8px) → `rounded-control` (4px), según el documento
- Variantes: `primary` (sólido `brand-600`), `gold` (sólido `accent-gold`), `outline-light` (borde blanco, para el hero), `outline-dark` (borde `brand-600`), `ghost`, `danger`
- Hover: oscurece un tono **y** `scale(1.02)`; active `scale(0.98)` con sombra reducida
- `transition-colors` → `transition-[colors,transform]`

El `scale` en hover exige que la transición incluya `transform`, que hoy no incluye.

### 6.2 `Field` — modificar

Se conservan `Envoltura`, `Input`, `Select`, `Textarea` y la compatibilidad con `register()` de React Hook Form. Cambia solo `claseControl`:

- `rounded-lg` → `rounded-control`
- Foco: `focus:border-brand-600 focus:border-b-2` en lugar del anillo actual, según la tabla de microinteracciones del documento

### 6.3 `Container` — nuevo

```ts
interface ContainerProps {
  width?: 'editorial' | 'wide'   // 1200px | 1440px, por defecto 'editorial'
  as?: ElementType               // por defecto 'div'
  className?: string
  children: ReactNode
}
```

Padding lateral: 24px en tablet, 16px en móvil.

### 6.4 `Section` — nuevo

```ts
interface SectionProps {
  density?: 'editorial' | 'utility'   // padding vertical 96px | 32px
  surface?: 'default' | 'muted' | 'dark'
  as?: ElementType                    // por defecto 'section'
  id?: string                         // para los anclajes del menú
  className?: string
  children: ReactNode
}
```

### 6.5 `Card` — nuevo

```ts
interface CardProps {
  density?: 'editorial' | 'utility'   // padding 32px | 16px
  interactive?: boolean               // activa hover: translateY(-4px) + shadow-card-hover
  as?: ElementType
  className?: string
  children: ReactNode
}
```

### 6.6 `Logo` — nuevo

```ts
interface LogoProps {
  variant?: 'dark' | 'light'   // sobre fondo claro | sobre hero y footer
  className?: string
}
```

Mientras no exista el archivo del logo, renderiza un logotipo tipográfico: "URBANOS & RURALES" en Playfair Display 700, con `letter-spacing` ajustado. El componente aísla el cambio: sustituir el provisional por el archivo real toca un solo archivo.

### 6.7 No se construyen aquí

`Accordion` y `Carousel` solo los usa la landing. Se construyen en el sub-proyecto 3, con su caso de uso real delante.

---

## 7. Shell público (`src/app/layouts/PublicLayout.tsx`)

### 7.1 Header — dos modos

| Modo | Dónde | Aspecto inicial |
|---|---|---|
| `transparent` | Solo la landing (`/`) | Fondo transparente sobre el hero, logo y nav en blanco |
| `solid` | Todas las demás rutas públicas | Fondo blanco y sombra desde el primer píxel |

Un header transparente sobre un listado no tendría hero sobre el cual ser transparente. El modo se deriva de la ruta activa con `useLocation()`, sin prop ni contexto: es una función pura de la ruta.

**Al hacer scroll** (ambos modos, umbral 40px): padding vertical 20px → 12px, fondo blanco opaco, `shadow-header`, texto a `text-primary`. La transición es de 0.2s sobre `background-color`, `padding` y `color`.

El listener de scroll usa `passive: true` y se limpia al desmontar.

### 7.2 Navegación

```
Arrendar   → /inmuebles?operacion=arriendo
Comprar    → /inmuebles?operacion=venta
Consignar  → /#consignar
Servicios  → /#servicios
Contacto   → /#contacto
```

Arriendos va primero: es el foco declarado del producto. "Blog" no se incluye — no hay contenido. Ningún item apunta a una página vacía: los que no tienen ruta propia hacen scroll a una sección de la landing.

Estilo: Inter 500, 13px, uppercase, `letter-spacing: 1.5px`. Hover → `brand-600`.

**Rutas ancla.** Las rutas `/#seccion` solo funcionan estando en la landing. Al pulsarlas desde otra ruta hay que navegar a `/` y luego hacer scroll. Se implementa con un `<AnchorLink>` que compara `location.pathname`: si ya está en `/`, hace `scrollIntoView({ behavior: 'smooth' })`; si no, navega con `navigate('/', { state: { scrollTo: id } })` y la landing consume ese `state` al montar. La landing (sub-proyecto 3) debe honrar ese `state`; se documenta como contrato en este spec.

Las secciones `#consignar` y `#servicios` **todavía no existen** hasta el sub-proyecto 3. Hasta entonces el scroll no encuentra destino y no hace nada — degradación aceptable, sin error.

### 7.3 CTAs del header

- "Buscar inmueble" — `outline-light` sobre el hero, `outline-dark` al hacer scroll
- "Consignar" — `primary` sólido

### 7.4 Drawer móvil

Por debajo de 768px, botón hamburguesa (dos líneas) que abre un panel deslizante desde la derecha, fondo blanco, con los mismos items y los CTAs apilados.

Requisitos:

- `role="dialog"` y `aria-modal="true"`
- Foco atrapado dentro del panel mientras está abierto; al cerrar, vuelve al botón hamburguesa
- `Esc` cierra
- Scroll del body bloqueado mientras está abierto
- Backdrop semitransparente; clic en él cierra
- Se cierra automáticamente al cambiar de ruta
- Animación de entrada solo con `transform: translateX()`

### 7.5 Footer

Fondo `surface-dark` (`#1C1C1E`). Cuatro columnas en escritorio, dos en tablet, apiladas en móvil.

| Columna 1 | Columna 2 | Columna 3 | Columna 4 |
|---|---|---|---|
| Logo `light` + lema | **Servicios** | **Contacto** | **Síguenos** |
| | Arrendar | Teléfono | Facebook |
| | Comprar | WhatsApp | Instagram |
| | Consignar | Correo | YouTube |
| | Avalúos | Dirección Bogotá | LinkedIn |

Solo Bogotá. La oficina de Medellín del documento no existe.

Links: `text-muted-inverse` (`#AAAAAA`), hover `#FFFFFF`, transición 0.2s. Los iconos de redes llevan `aria-label` con el nombre de la red y abren en pestaña nueva con `rel="noopener noreferrer"`.

Barra inferior sobre `surface-darker` (`#111111`): "© 2026 Urbanos & Rurales S.A.S. Todos los derechos reservados." más enlaces a Política de Privacidad y Términos y Condiciones. Esas páginas no existen todavía (sub-proyecto 4); por ahora apuntan a la política publicada en `https://urbanosrurales.com/politicas-de-privacidad-y-datos/`.

El año se calcula con `new Date().getFullYear()`, como ya hace el footer actual.

### 7.6 Botón flotante de WhatsApp

Componente propio, `shared/components/WhatsAppFab.tsx`:

- Círculo `#25D366`, icono blanco; 56px en escritorio, 48px en móvil
- Posición fija, esquina inferior derecha, 24px de margen
- Aparece a los 2 segundos de carga o al primer scroll, lo que ocurra primero, con fade-in
- Tooltip a la izquierda: "Respondemos en segundos", fondo blanco, `shadow-dropdown`, radio 4px
- Enlaza a `https://wa.me/573504636177?text=<mensaje precargado>`
- `aria-label="Escribir por WhatsApp"`, `rel="noopener noreferrer"`
- Área táctil mínima de 44×44px

Se monta en `PublicLayout`, fuera del `<main>`.

---

## 8. `src/shared/config/site.ts`

Fuente única de los datos de la empresa. Objeto tipado y `as const`.

```ts
export const site = {
  razonSocial: 'URBANOS & RURALES S.A.S',
  nombreCorto: 'Urbanos & Rurales',
  lema: 'Conocemos el territorio para viabilizar sus proyectos',
  anioFundacion: 1996,
  contacto: {
    telefono: '+57 (1) 4557844',
    whatsapp: '573504636177',
    whatsappVisible: '+57 350 463 6177',
    email: 'contacto@urbanosrurales.com',
  },
  direccion: {
    calle: 'Carrera 15 # 98-12, Oficina 602',
    edificio: 'Edificio Office Point',
    ciudad: 'Bogotá',
    pais: 'Colombia',
  },
  redes: {
    facebook: 'https://www.facebook.com/urbanosrurales.sas',
    instagram: 'https://www.instagram.com/urbanos.rurales',
    youtube: 'https://www.youtube.com/channel/UCuX5QknUzLWEqT-xmk6WPAg',
    linkedin: 'https://www.linkedin.com/in/urbanos-rurales-41047b21a/',
  },
  legal: {
    politicaPrivacidad: 'https://urbanosrurales.com/politicas-de-privacidad-y-datos/',
  },
} as const
```

Todos los valores están verificados contra urbanosrurales.com. Los componentes leen de aquí; ningún dato de contacto se escribe literal en el JSX.

---

## 9. Lo que no se inventa

Tres puntos quedan pendientes de confirmación del cliente. Se marcan con `// TODO(cliente):` en el código y **no** se rellenan con valores plausibles.

1. **Años de trayectoria.** El sitio actual dice "desde 1996" en un lugar y "18 años" en otro; en 2026 serían 30. `site.anioFundacion` guarda 1996, que es el dato verificable, pero **ninguna superficie muestra una cifra de años** hasta que se confirme cuál es la correcta.

2. **El logo.** No se pudo extraer del sitio actual: el header lo sirve como GIF base64 con lazy-load, sin URL de origen. Se necesita el SVG o un PNG en alta resolución. Hasta entonces, `Logo` renderiza el logotipo tipográfico provisional descrito en 6.6.

3. **Contenido de marketing del documento de diseño.** Los logos de medios (El Tiempo, Portafolio, Fedelonjas, Semana…), los portales aliados (Fincaraíz, Metro Cuadrado, LaHaus…), los testimonios de clientes, las cifras "12 años" y "12 operaciones exitosas", las comisiones del 3% y de un canon, y la oficina de Medellín provienen de Mubrick, no de Urbanos & Rurales. Nada de eso entra al código. Las secciones que dependen de esos datos se replantean en el sub-proyecto 3, apoyándose en los activos reales de la empresa: trayectoria desde 1996, certificaciones ISO 9001 y 14001, equipo interdisciplinario y contratos con entidades del sector público.

---

## 10. Accesibilidad

- Contraste WCAG AA en todo el texto. `brand-600` (`#0D6E6E`) sobre blanco da 6.05:1; `text-secondary` (`#4A4A4A`) sobre blanco da 8.86:1; `text-tertiary` (`#6B6B6B`) sobre blanco da 5.33:1; `text-muted-inverse` (`#AAAAAA`) sobre `#1C1C1E` da 7.33:1. Todos superan el 4.5:1 exigido para texto normal.
- `focus-visible` global con outline de 2px en `brand-600`.
- Skip link "Saltar al contenido" como primer elemento tabulable, visible solo al recibir foco.
- Objetivos táctiles de 44×44px como mínimo en móvil.
- El drawer cumple los requisitos de diálogo modal de 7.4.
- Toda imagen lleva `alt` significativo; los iconos decorativos, `aria-hidden="true"`.
- El layout soporta zoom del navegador al 200% sin romperse.

---

## 11. Rendimiento

- Animaciones solo sobre `transform` y `opacity`.
- Fuentes self-hosted con `font-display: swap`.
- El listener de scroll del header es `passive` y se limpia al desmontar.
- Sin librerías nuevas más allá de los dos paquetes de Fontsource.

---

## 12. Verificación

El proyecto no tiene test runner configurado y añadir uno es una decisión aparte, fuera de este sub-proyecto. La verificación es:

1. `pnpm lint` sin errores
2. `pnpm build` sin errores de TypeScript
3. Revisión visual a 320, 768, 1024 y 1440px de:
   - Header en modo `transparent` sobre la landing y en modo `solid` en otra ruta
   - Transición de scroll del header
   - Drawer móvil: apertura, cierre con `Esc`, cierre con backdrop, foco atrapado, scroll bloqueado
   - Footer en sus tres disposiciones de columnas
   - FAB de WhatsApp en ambos tamaños, con su tooltip
4. Navegación completa por teclado con foco visible en todo momento
5. El panel admin sigue funcionando y ahora se ve verde en lugar de azul, sin ningún cambio en sus archivos

---

## 13. Archivos

**Modificados**

- `src/index.css` — tokens y estilos base
- `src/main.tsx` — importación de fuentes
- `src/app/layouts/PublicLayout.tsx` — reescrito
- `src/shared/components/ui/Button.tsx` — variantes, radio, transición
- `src/shared/components/ui/Field.tsx` — radio y estado de foco
- `package.json` — dos dependencias de Fontsource

**Nuevos**

- `src/shared/config/site.ts`
- `src/shared/components/ui/Container.tsx`
- `src/shared/components/ui/Section.tsx`
- `src/shared/components/ui/Card.tsx`
- `src/shared/components/ui/Logo.tsx`
- `src/shared/components/WhatsAppFab.tsx`
- `src/app/layouts/public/Header.tsx`
- `src/app/layouts/public/MobileDrawer.tsx`
- `src/app/layouts/public/Footer.tsx`
- `src/app/layouts/public/AnchorLink.tsx`
- `src/app/layouts/public/navItems.ts`

El header, el drawer y el footer salen de `PublicLayout` a archivos propios: juntos superarían las 400 líneas en un solo archivo, y cada uno tiene un propósito y un contrato distintos.
