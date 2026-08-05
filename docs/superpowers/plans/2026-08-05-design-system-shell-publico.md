# Design System + Shell Público — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la paleta azul del proyecto por el design system verde petróleo del documento de UX/UI y reconstruir el shell del sitio público (header de dos modos, drawer móvil, footer oscuro, botón flotante de WhatsApp).

**Architecture:** La escala de color nueva se escribe **sobre los nombres de token existentes** (`brand-*`, `surface-muted`), de modo que el panel admin cambia de azul a verde sin editar ninguno de sus archivos. El sistema soporta dos densidades — editorial para landing y páginas institucionales, utilidad para el marketplace — expresadas como props de los componentes `Section`, `Container` y `Card` en vez de utilidades custom de Tailwind. El `PublicLayout` actual se descompone en `Header`, `MobileDrawer` y `Footer`, cada uno en su archivo.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4 (configuración CSS-based vía `@theme`), React Router v6, Fontsource.

**Spec:** `docs/superpowers/specs/2026-08-05-design-system-shell-publico-design.md`

---

## Global Constraints

- **Sin gradientes.** Ningún `linear-gradient`, `radial-gradient` ni utilidad `bg-gradient-*` en ninguna parte.
- **Sin tema oscuro.** Las únicas superficies oscuras son el footer (`#1C1C1E` / `#111111`) y el overlay del hero.
- **Idioma:** el dominio, los comentarios y los nombres de props de dominio van en español, según `CLAUDE.md`. Los nombres de componentes de UI compartida siguen la convención existente en inglés (`Button`, `Card`, `Section`).
- **Formato Prettier del proyecto:** sin punto y coma, comillas simples, comas finales en todo, ancho de 100 caracteres.
- **Path alias:** `@/*` → `src/*`. Usar siempre el alias, nunca rutas relativas que suban de directorio.
- **Animaciones solo sobre `transform` y `opacity`.**
- **No añadir dependencias** más allá de los dos paquetes de Fontsource de la Tarea 1.
- **No tocar ningún archivo bajo `src/features/admin/`.** Si una tarea parece requerirlo, es señal de que algo se desvió del plan: parar y reportar.
- **Datos de contacto:** ningún literal de teléfono, correo, dirección o red social en el JSX. Todo sale de `@/shared/config/site`.
- **Dos datos van en blanco a propósito** y se marcan con `// TODO(cliente):` — el archivo del logo y cualquier cifra de años de trayectoria. No inventar valores plausibles.

### Nota sobre verificación

**Este plan no usa ciclos TDD porque el proyecto no tiene test runner configurado**, y añadir uno queda explícitamente fuera del alcance según la sección 12 del spec. Un design system de tokens CSS y componentes de presentación tampoco es lo que mejor sirve un test unitario.

La puerta de verificación de cada tarea es, en su lugar:

1. `pnpm lint` sin errores
2. `pnpm build` sin errores de TypeScript
3. Comprobación visual o de comportamiento concreta, descrita paso a paso en la tarea

Todos los comandos se ejecutan desde `FrontEndUrbanos/`.

---

## Estructura de archivos

**Modificados**

| Archivo | Responsabilidad tras el cambio |
|---|---|
| `src/index.css` | Tokens del design system y estilos base globales |
| `src/main.tsx` | Punto de entrada; importa las fuentes antes de los estilos |
| `src/shared/components/ui/Button.tsx` | Botón con 6 variantes y radio de 4px |
| `src/shared/components/ui/Field.tsx` | Controles de formulario con foco de borde inferior |
| `src/app/layouts/PublicLayout.tsx` | Solo ensambla el shell: skip link, header, main, footer, FAB |

**Nuevos**

| Archivo | Responsabilidad |
|---|---|
| `src/shared/config/site.ts` | Fuente única de los datos de la empresa |
| `src/shared/components/ui/Container.tsx` | Ancho máximo y padding lateral, en dos anchos |
| `src/shared/components/ui/Logo.tsx` | Aísla el logo pendiente en un solo punto |
| `src/app/layouts/public/navItems.ts` | Definición declarativa del menú |
| `src/app/layouts/public/AnchorLink.tsx` | Enlace a sección de la landing desde cualquier ruta |
| `src/app/layouts/public/NavLinks.tsx` | Renderiza `navItems`; el llamador aporta las clases |
| `src/app/layouts/public/MobileDrawer.tsx` | Panel de navegación móvil con semántica de diálogo modal |
| `src/app/layouts/public/Header.tsx` | Cabecera de dos modos con comportamiento de scroll |
| `src/app/layouts/public/Footer.tsx` | Pie oscuro de cuatro columnas |
| `src/shared/components/WhatsAppFab.tsx` | Botón flotante de contacto |

---

## Task 1: Tokens, estilos base y tipografías

**Files:**
- Modify: `FrontEndUrbanos/src/index.css` (reemplaza el bloque `@theme` completo, líneas 3-40)
- Modify: `FrontEndUrbanos/src/main.tsx:3`
- Modify: `FrontEndUrbanos/package.json` (dependencias)

**Interfaces:**
- Consumes: nada, es la primera tarea
- Produce: los tokens que consumen **todas** las tareas siguientes. Los nombres de utilidad de Tailwind que quedan disponibles son `bg-brand-{50..900}`, `text-brand-*`, `border-brand-*`, `bg-accent-gold`, `bg-accent-gold-hover`, `bg-surface`, `bg-surface-muted`, `bg-surface-card`, `bg-surface-dark`, `bg-surface-darker`, `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `text-text-disabled`, `text-text-inverse`, `text-text-muted-inverse`, `border-border`, `text-error`, `text-success`, `font-sans`, `font-serif`, `rounded-control`, `rounded-card`, `shadow-card`, `shadow-card-hover`, `shadow-dropdown`, `shadow-header`

- [ ] **Step 1: Instalar las fuentes**

Desde `FrontEndUrbanos/`:

```bash
pnpm add @fontsource-variable/inter @fontsource/playfair-display
```

- [ ] **Step 2: Importar las fuentes en el punto de entrada**

En `src/main.tsx`, añadir las tres importaciones **antes** de `import './index.css'`, para que las declaraciones `@font-face` precedan a los estilos que las usan:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import './index.css'
import App from './App'
```

El resto del archivo no cambia. Solo se cargan los pesos 600 y 700 de Playfair porque son los únicos que usa la escala tipográfica; Inter se carga como fuente variable, un solo archivo para todos los pesos.

- [ ] **Step 3: Reescribir los tokens**

Reemplazar el contenido completo de `src/index.css` por:

```css
@import "tailwindcss";

/* ─── Design tokens ─────────────────────────────────────────────────────────
   Paleta verde petróleo del documento de UX/UI. La escala se escribe sobre los
   nombres `brand-*` que ya usaba la paleta azul anterior, para que el panel
   admin herede el color nuevo sin tocar ninguno de sus archivos. Por la misma
   razón se conserva el nombre `surface-muted` con un valor nuevo: `Button` y
   `Field` ya dependen de él.
   Todos los colores son sólidos: el sistema no usa gradientes en ninguna parte.
   ────────────────────────────────────────────────────────────────────────── */
@theme {
  /* Marca — escala derivada de #0D6E6E, el único acento que fija el documento */
  --color-brand-50:  #F0F7F7;
  --color-brand-100: #D6E9E9;
  --color-brand-200: #ADD3D3;
  --color-brand-300: #6FB3B3;
  --color-brand-400: #3A9090;
  --color-brand-500: #1A7E7E;
  --color-brand-600: #0D6E6E;
  --color-brand-700: #0A5757;
  --color-brand-800: #084545;
  --color-brand-900: #063535;

  /* Acento secundario */
  --color-accent-gold:       #B8960C;
  --color-accent-gold-hover: #9A7D0A;

  /* Superficies */
  --color-surface:        #FFFFFF;
  --color-surface-muted:  #F5F6FA;
  --color-surface-card:   #FAFAF8;
  --color-surface-dark:   #1C1C1E;
  --color-surface-darker: #111111;

  /* Texto */
  --color-text-primary:       #1C1C1E;
  --color-text-secondary:     #4A4A4A;
  --color-text-tertiary:      #6B6B6B;
  --color-text-disabled:      #9A9A9A;
  --color-text-inverse:       #FFFFFF;
  --color-text-muted-inverse: #AAAAAA;

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
  --radius-control: 4px;
  --radius-card:    8px;

  /* Sombras — deliberadamente sutiles */
  --shadow-card:       0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 12px 32px rgba(0, 0, 0, 0.08);
  --shadow-dropdown:   0 8px 24px rgba(0, 0, 0, 0.06);
  --shadow-header:     0 1px 0 rgba(0, 0, 0, 0.05);

  /* Espaciado extra heredado */
  --spacing-18: 4.5rem;
  --spacing-22: 5.5rem;
}

/* ─── Estilos base ──────────────────────────────────────────────────────── */
@layer base {
  body {
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Indicador de foco visible en todo elemento interactivo, requisito WCAG */
  :focus-visible {
    outline: 2px solid var(--color-brand-600);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 4: Verificar que compila y que las utilidades nuevas existen**

```bash
pnpm lint
pnpm build
```

Esperado: ambos sin errores. Si `pnpm build` falla con "Cannot find module '@fontsource-variable/inter'", el Step 1 no se completó.

- [ ] **Step 5: Verificar visualmente que el admin heredó el color**

```bash
pnpm dev
```

Abrir `http://localhost:5173/admin/login`. Esperado: el botón de submit y los estados de foco están en **verde petróleo**, no en azul. La tipografía del cuerpo es Inter (no la fuente del sistema).

Esto confirma la premisa central del diseño: el admin cambió de color sin que se editara ninguno de sus archivos.

- [ ] **Step 6: Commit**

```bash
git add FrontEndUrbanos/src/index.css FrontEndUrbanos/src/main.tsx FrontEndUrbanos/package.json FrontEndUrbanos/pnpm-lock.yaml
git commit -m "feat(ui): paleta verde petroleo y tipografias del design system

Escribe la escala nueva sobre los nombres brand-* existentes para que el
panel admin herede el color sin editar ninguno de sus archivos. Inter y
Playfair Display se sirven self-hosted via Fontsource en lugar de Google
Fonts, lo que saca dos conexiones a terceros del critical path."
```

---

## Task 2: Primitivo de layout — `Container`

**Files:**
- Create: `FrontEndUrbanos/src/shared/components/ui/Container.tsx`

**Interfaces:**
- Consumes: nada de la Tarea 1 en tiempo de compilación; usa utilidades estándar de Tailwind
- Produce: `Container({ width?: 'editorial' | 'wide', as?: ElementType, className?: string, children: ReactNode })` — lo consumen las tareas 7 y 8

Exportación nombrada, no `default`, siguiendo la convención de `Button` y `Field`.

**Nota de alcance.** El spec describía también `Section` y `Card` como parte del design system. **No se construyen aquí**: ningún componente de este sub-proyecto los consume — sus usuarios están en el marketplace y en la landing. Se crearán en el sub-proyecto que los necesite, con requisitos reales delante; la card del listado, por ejemplo, tendrá que resolver imagen, precio y badge de operación, y diseñar su API ahora sería adivinar. La decisión de las dos densidades sigue registrada en el spec y `Container` ya la encarna en su prop `width`.

- [ ] **Step 1: Crear `Container`**

```tsx
import type { ElementType, ReactNode } from 'react'

/**
 * Ancho máximo y padding lateral del contenido.
 *
 * `editorial` (1200px) es para landing y páginas institucionales; `wide`
 * (1440px) para el marketplace, que necesita caber más columnas de resultados.
 */
interface ContainerProps {
  width?: 'editorial' | 'wide'
  as?: ElementType
  className?: string
  children: ReactNode
}

const anchoClases: Record<NonNullable<ContainerProps['width']>, string> = {
  editorial: 'max-w-[1200px]',
  wide: 'max-w-[1440px]',
}

export function Container({
  width = 'editorial',
  as: Tag = 'div',
  className = '',
  children,
}: ContainerProps) {
  return (
    <Tag className={['mx-auto w-full px-4 sm:px-6', anchoClases[width], className].join(' ')}>
      {children}
    </Tag>
  )
}
```

`px-4` son los 16px de móvil y `sm:px-6` los 24px de tablet en adelante, tal como fija el spec.

- [ ] **Step 2: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores. `Container` todavía no tiene consumidores — los gana en las tareas 7 y 8 —, así que esto solo confirma que tipa y compila.

- [ ] **Step 3: Commit**

```bash
git add FrontEndUrbanos/src/shared/components/ui/Container.tsx
git commit -m "feat(ui): primitivo Container con dos anchos

editorial (1200px) para landing e institucionales, wide (1440px) para el
marketplace, que necesita caber mas columnas de resultados."
```

---

## Task 3: Actualizar `Button` y `Field`

**Files:**
- Modify: `FrontEndUrbanos/src/shared/components/ui/Button.tsx:3-39`
- Modify: `FrontEndUrbanos/src/shared/components/ui/Field.tsx:15-19`

**Interfaces:**
- Consumes: tokens de la Tarea 1
- Produce: `Button` con `variant?: 'primary' | 'secondary' | 'gold' | 'outline-light' | 'ghost' | 'danger'`. Las tareas 6, 7 y 8 usan `primary`, `secondary`, `gold` y `outline-light`.

**Restricción crítica de esta tarea:** `variant="secondary"` está usado en 8 puntos de `src/features/admin/`. **Se conserva tal cual.** Las variantes solo se añaden, nunca se renombran ni se eliminan.

- [ ] **Step 1: Actualizar las variantes, el radio y la transición de `Button`**

Reemplazar las líneas 3-39 de `src/shared/components/ui/Button.tsx` (desde `interface ButtonProps` hasta el cierre del array de clases) por:

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline-light' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-white text-brand-700 border border-brand-300 hover:bg-brand-50 focus-visible:ring-brand-500',
  gold:
    'bg-accent-gold text-white hover:bg-accent-gold-hover focus-visible:ring-accent-gold disabled:opacity-60',
  // Solo para el header sobre el hero, donde el fondo es una foto oscurecida.
  'outline-light':
    'border border-white/70 text-white hover:bg-white/10 focus-visible:ring-white',
  ghost: 'text-text-secondary hover:bg-surface-muted focus-visible:ring-brand-500',
  danger: 'bg-error text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:opacity-60',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading, disabled, children, className = '', ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold tracking-[0.5px]',
        'transition-[color,background-color,border-color,transform,box-shadow] duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
```

Tres cambios que conviene entender:

- `rounded-lg` (8px) → `rounded-control` (4px), el radio que fija el documento para botones.
- La transición pasa de `transition-colors` a incluir `transform`: sin eso el `scale` del hover sería instantáneo.
- `disabled:hover:scale-100` evita que un botón deshabilitado reaccione al puntero.

El resto del archivo — el SVG del spinner, `Button.displayName` — no cambia.

- [ ] **Step 2: Actualizar el estado de foco de `Field`**

Reemplazar `claseControl` (líneas 15-19) de `src/shared/components/ui/Field.tsx` por:

```tsx
const claseControl = [
  'mt-1 w-full rounded-control border border-border px-3 py-2 text-sm outline-none',
  'transition-colors focus:border-b-2 focus:border-b-brand-600',
  'disabled:bg-surface-muted disabled:text-text-secondary',
].join(' ')
```

El documento pide que el foco engrose el borde inferior a 2px en verde, en vez del anillo que había. El resto del archivo no cambia.

- [ ] **Step 3: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores. Si TypeScript se queja de `variant="secondary"` en alguna página del admin, la variante se eliminó por error: volver al Step 1.

- [ ] **Step 4: Verificar el comportamiento en el navegador**

`pnpm dev`, abrir `http://localhost:5173/admin/login`.

Comprobar:
1. El botón de submit tiene esquinas de 4px, no de 8px.
2. Al pasar el puntero crece ligeramente y oscurece.
3. Al hacer clic se encoge.
4. Al enfocar un input con `Tab`, su borde inferior se engrosa en verde.
5. Con `prefers-reduced-motion` activo en el sistema operativo, el botón cambia de color pero no escala de forma animada.

- [ ] **Step 5: Commit**

```bash
git add FrontEndUrbanos/src/shared/components/ui/Button.tsx FrontEndUrbanos/src/shared/components/ui/Field.tsx
git commit -m "feat(ui): variantes gold y outline-light, radio de 4px y foco inferior

Anade variantes en lugar de renombrarlas: variant=secondary esta usado en
8 puntos del admin y el sub-proyecto promete no tocar esos archivos."
```

---

## Task 4: Datos de la empresa y componente `Logo`

**Files:**
- Create: `FrontEndUrbanos/src/shared/config/site.ts`
- Create: `FrontEndUrbanos/src/shared/components/ui/Logo.tsx`

**Interfaces:**
- Consumes: nada
- Produce:
  - `site` — objeto `as const` con `razonSocial`, `nombreCorto`, `lema`, `anioFundacion`, `contacto.{telefono,whatsapp,whatsappVisible,email}`, `direccion.{calle,edificio,ciudad,pais}`, `redes.{facebook,instagram,youtube,linkedin}`, `legal.politicaPrivacidad`. Lo consumen las tareas 8 y 9.
  - `Logo({ variant?: 'dark' | 'light', className?: string })` — lo consumen las tareas 6, 7 y 8.

- [ ] **Step 1: Crear `site.ts`**

```ts
/**
 * Fuente única de los datos de la empresa.
 *
 * Todos los valores están verificados contra urbanosrurales.com. Ningún
 * componente escribe un teléfono, correo, dirección o red social literal en el
 * JSX: todo se lee de aquí, para que cambiarlos sea editar un solo archivo.
 */
export const site = {
  razonSocial: 'URBANOS & RURALES S.A.S',
  nombreCorto: 'Urbanos & Rurales',
  lema: 'Conocemos el territorio para viabilizar sus proyectos',

  // TODO(cliente): el sitio actual dice "desde 1996" en un lugar y "18 años" en
  // otro, lo que en 2026 no cuadra (serían 30). Hasta que el cliente confirme
  // la cifra correcta, ninguna superficie muestra años de trayectoria.
  anioFundacion: 1996,

  contacto: {
    telefono: '+57 (1) 4557844',
    // Formato E.164 sin signos, que es lo que espera la URL de wa.me
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
    // Apunta al sitio actual hasta que exista la página propia (sub-proyecto 4)
    politicaPrivacidad: 'https://urbanosrurales.com/politicas-de-privacidad-y-datos/',
  },
} as const
```

- [ ] **Step 2: Crear `Logo`**

```tsx
/**
 * Aísla el logo en un único punto del código.
 *
 * TODO(cliente): falta el archivo del logo. El sitio actual lo sirve como GIF
 * en base64 con lazy-load, sin URL de origen, así que no se pudo extraer.
 * Por decisión del cliente el slot va en blanco — deliberadamente NO se
 * sustituye por un logotipo tipográfico. Reserva sus dimensiones para que el
 * header no salte de layout el día que llegue el SVG.
 */
interface LogoProps {
  /**
   * Aceptada ya para que las llamadas no cambien cuando llegue el archivo:
   * `light` será la versión sobre el hero y el footer. Hoy no tiene efecto
   * porque el slot está vacío.
   */
  variant?: 'dark' | 'light'
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return <span aria-hidden="true" className={['block h-10 w-[180px]', className].join(' ')} />
}
```

`aria-hidden` es correcto aquí precisamente porque el slot está vacío: no hay nada que anunciar. El nombre accesible del enlace a inicio lo aporta el `aria-label` del `<Link>` que lo envuelve, en las tareas 6 y 8.

- [ ] **Step 3: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores. En particular, ESLint no debe reportar `variant` como parámetro sin usar, porque no se desestructura.

- [ ] **Step 4: Commit**

```bash
git add FrontEndUrbanos/src/shared/config/site.ts FrontEndUrbanos/src/shared/components/ui/Logo.tsx
git commit -m "feat(shared): datos de la empresa y slot del logo

Los datos salen verificados de urbanosrurales.com. El logo va en blanco por
decision del cliente, con las dimensiones reservadas para evitar un salto de
layout cuando llegue el archivo."
```

---

## Task 5: Definición del menú, `AnchorLink` y `NavLinks`

**Files:**
- Create: `FrontEndUrbanos/src/app/layouts/public/navItems.ts`
- Create: `FrontEndUrbanos/src/app/layouts/public/AnchorLink.tsx`
- Create: `FrontEndUrbanos/src/app/layouts/public/NavLinks.tsx`

**Interfaces:**
- Consumes: nada
- Produce:
  - `type NavItem = { label: string; to: string; anchor?: string }` y `navItems: readonly NavItem[]`
  - `AnchorLink({ anchor: string; className?: string; onNavigate?: () => void; children: ReactNode })` — la consumen las tareas 6, 7 y 8
  - `NavLinks({ claseEnlace: string; onNavigate?: () => void })` — la consumen las tareas 6 y 7

- [ ] **Step 1: Crear `navItems.ts`**

```ts
/**
 * Menú del sitio público.
 *
 * Arriendos va primero porque es el foco declarado del producto. "Blog" no
 * aparece: no hay contenido, y un item que lleva a una página vacía es peor
 * que un item ausente.
 *
 * Los items con `anchor` no tienen ruta propia; hacen scroll a una sección de
 * la landing vía `AnchorLink`.
 */
export interface NavItem {
  label: string
  to: string
  anchor?: string
}

export const navItems: readonly NavItem[] = [
  { label: 'Arrendar', to: '/inmuebles?operacion=arriendo' },
  { label: 'Comprar', to: '/inmuebles?operacion=venta' },
  { label: 'Consignar', to: '/', anchor: 'consignar' },
  { label: 'Servicios', to: '/', anchor: 'servicios' },
  { label: 'Contacto', to: '/', anchor: 'contacto' },
] as const
```

- [ ] **Step 2: Crear `AnchorLink`**

```tsx
import type { MouseEvent, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Enlace a una sección de la landing que funciona desde cualquier ruta.
 *
 * Estando en `/` hace scroll directo. Desde otra ruta no puede: la sección no
 * está montada. Navega entonces a `/` pasando el destino en el `state` del
 * router, y la landing lo consume al montar para hacer el scroll.
 *
 * Contrato para la landing (sub-proyecto 3): al montar debe leer
 * `useLocation().state?.scrollTo` y, si trae un id, hacer scroll a él.
 *
 * Mientras esas secciones no existan, el scroll no encuentra destino y no pasa
 * nada. Degrada sin error.
 */
interface AnchorLinkProps {
  anchor: string
  className?: string
  /** Permite al drawer móvil cerrarse al navegar. */
  onNavigate?: () => void
  children: ReactNode
}

export function AnchorLink({ anchor, className = '', onNavigate, children }: AnchorLinkProps) {
  const location = useLocation()
  const navigate = useNavigate()

  function manejarClic(evento: MouseEvent<HTMLAnchorElement>) {
    evento.preventDefault()
    onNavigate?.()

    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    navigate('/', { state: { scrollTo: anchor } })
  }

  // El href real se conserva para que el enlace sea copiable y abrible en una
  // pestaña nueva; el onClick solo intercepta el clic normal.
  return (
    <a href={`/#${anchor}`} onClick={manejarClic} className={className}>
      {children}
    </a>
  )
}
```

- [ ] **Step 3: Crear `NavLinks`**

El header y el drawer recorren `navItems` con la misma estructura y solo se
diferencian en las clases. Ese recorrido vive en un único sitio:

```tsx
import { Link } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { navItems } from '@/app/layouts/public/navItems'

/**
 * Renderiza los items del menú, eligiendo entre enlace de ruta y enlace de
 * ancla según cada item.
 *
 * No decide su propia apariencia: el llamador pasa las clases, porque el
 * header las cambia según el modo de scroll y el drawer las tiene fijas.
 * Devuelve un fragmento, así que el llamador también controla el contenedor
 * y su disposición.
 */
interface NavLinksProps {
  claseEnlace: string
  /** Permite al drawer móvil cerrarse al navegar. */
  onNavigate?: () => void
}

export function NavLinks({ claseEnlace, onNavigate }: NavLinksProps) {
  return (
    <>
      {navItems.map((item) =>
        item.anchor ? (
          <AnchorLink
            key={item.label}
            anchor={item.anchor}
            onNavigate={onNavigate}
            className={claseEnlace}
          >
            {item.label}
          </AnchorLink>
        ) : (
          <Link key={item.label} to={item.to} onClick={onNavigate} className={claseEnlace}>
            {item.label}
          </Link>
        ),
      )}
    </>
  )
}
```

- [ ] **Step 4: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add FrontEndUrbanos/src/app/layouts/public/navItems.ts FrontEndUrbanos/src/app/layouts/public/AnchorLink.tsx FrontEndUrbanos/src/app/layouts/public/NavLinks.tsx
git commit -m "feat(public): definicion del menu, enlace a secciones y NavLinks

Ningun item lleva a una pagina vacia: los que no tienen ruta propia hacen
scroll a una seccion, navegando primero a / si hace falta. NavLinks deja el
recorrido de navItems en un solo sitio; las clases las pone el llamador."
```

---

## Task 6: `MobileDrawer`

**Files:**
- Create: `FrontEndUrbanos/src/app/layouts/public/MobileDrawer.tsx`

**Interfaces:**
- Consumes: `NavLinks` y `AnchorLink` (Tarea 5); `Button` (Tarea 3)
- Produce: `MobileDrawer({ abierto: boolean; onCerrar: () => void })` — la consume la Tarea 7

Se construye antes que el `Header` porque el `Header` lo importa.

- [ ] **Step 1: Crear el componente**

```tsx
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { NavLinks } from '@/app/layouts/public/NavLinks'
import { Button } from '@/shared/components/ui/Button'

/**
 * Panel de navegación móvil. Se comporta como un diálogo modal: atrapa el foco,
 * cierra con Escape y bloquea el scroll de la página mientras está abierto.
 */
interface MobileDrawerProps {
  abierto: boolean
  onCerrar: () => void
}

const SELECTOR_ENFOCABLES = 'a[href], button:not([disabled]), input, select, textarea'

export function MobileDrawer({ abierto, onCerrar }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Bloquea el scroll del body mientras el panel está abierto, para que el
  // contenido de detrás no se desplace al arrastrar sobre el panel.
  useEffect(() => {
    if (!abierto) return

    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto])

  // Escape cierra; Tab queda atrapado dentro del panel.
  useEffect(() => {
    if (!abierto) return

    function manejarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        onCerrar()
        return
      }

      if (evento.key !== 'Tab' || !panelRef.current) return

      const enfocables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES),
      )
      if (enfocables.length === 0) return

      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [abierto, onCerrar])

  // Al abrir, mueve el foco al primer elemento del panel. Al cerrar, lo
  // devuelve a donde estaba —el botón hamburguesa—, como exige un diálogo
  // modal: sin esto el foco quedaría al principio del documento y quien navega
  // por teclado tendría que recorrerlo entero otra vez.
  useEffect(() => {
    if (!abierto) return

    const enfocadoPreviamente = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>(SELECTOR_ENFOCABLES)?.focus()

    return () => {
      enfocadoPreviamente?.focus()
    }
  }, [abierto])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="absolute top-0 right-0 flex h-full w-[80%] max-w-sm flex-col bg-surface p-6 shadow-dropdown"
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="mb-8 self-end p-2 text-text-primary"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <nav className="flex flex-col gap-6">
          <NavLinks
            claseEnlace="text-sm font-medium tracking-[1.5px] text-text-primary uppercase"
            onNavigate={onCerrar}
          />
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <Link to="/inmuebles?operacion=arriendo" onClick={onCerrar}>
            <Button variant="secondary" size="lg" className="w-full">
              Buscar inmueble
            </Button>
          </Link>
          <AnchorLink anchor="consignar" onNavigate={onCerrar}>
            <Button variant="primary" size="lg" className="w-full">
              Consignar
            </Button>
          </AnchorLink>
        </div>
      </div>
    </div>
  )
}
```

`return null` cuando está cerrado es deliberado: deja el panel fuera del árbol accesible por completo, en vez de esconderlo con CSS y dejar sus enlaces tabulables.

- [ ] **Step 2: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores. El componente aún no tiene consumidor; se prueba en la Tarea 7.

- [ ] **Step 3: Commit**

```bash
git add FrontEndUrbanos/src/app/layouts/public/MobileDrawer.tsx
git commit -m "feat(public): drawer de navegacion movil con semantica de dialogo modal

Atrapa el foco, cierra con Escape y bloquea el scroll del body. Se desmonta
al cerrarse para que sus enlaces no queden tabulables detras del contenido."
```

---

## Task 7: `Header`

**Files:**
- Create: `FrontEndUrbanos/src/app/layouts/public/Header.tsx`

**Interfaces:**
- Consumes: `Logo` (Tarea 4), `NavLinks` y `AnchorLink` (Tarea 5), `MobileDrawer` (Tarea 6), `Button` (Tarea 3), `Container` (Tarea 2)
- Produce: `Header()` sin props — la consume la Tarea 10

- [ ] **Step 1: Crear el componente**

```tsx
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { MobileDrawer } from '@/app/layouts/public/MobileDrawer'
import { NavLinks } from '@/app/layouts/public/NavLinks'
import { Button } from '@/shared/components/ui/Button'
import { Container } from '@/shared/components/ui/Container'
import { Logo } from '@/shared/components/ui/Logo'

/**
 * Cabecera del sitio público, con dos modos.
 *
 * En la landing arranca transparente sobre el hero. En cualquier otra ruta
 * arranca sólida desde el primer píxel: un header transparente sobre un
 * listado no tendría hero sobre el cual ser transparente.
 *
 * En ambos modos, al hacer scroll se compacta y opaca.
 */
const UMBRAL_SCROLL = 40

export function Header() {
  const location = useLocation()
  const [scrolleado, setScrolleado] = useState(false)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const esLanding = location.pathname === '/'

  useEffect(() => {
    function alHacerScroll() {
      setScrolleado(window.scrollY > UMBRAL_SCROLL)
    }

    // Se evalúa también al montar: al llegar a una ruta con el scroll ya
    // desplazado, el evento no se dispara solo.
    alHacerScroll()
    window.addEventListener('scroll', alHacerScroll, { passive: true })
    return () => window.removeEventListener('scroll', alHacerScroll)
  }, [])

  // Cierra el drawer al cambiar de ruta.
  useEffect(() => {
    setDrawerAbierto(false)
  }, [location.pathname])

  const solido = !esLanding || scrolleado

  // El color de los enlaces depende del modo; el resto de su estilo es fijo.
  const claseEnlace = [
    'text-[13px] font-medium tracking-[1.5px] uppercase transition-colors',
    solido ? 'text-text-primary hover:text-brand-600' : 'text-white hover:text-brand-100',
  ].join(' ')

  return (
    <>
      <header
        className={[
          'fixed top-0 right-0 left-0 z-40',
          'transition-[background-color,padding,box-shadow] duration-200',
          solido ? 'bg-surface shadow-header' : 'bg-transparent',
          scrolleado ? 'py-3' : 'py-5',
        ].join(' ')}
      >
        <Container width="wide">
          <div className="flex items-center justify-between gap-6">
            {/* El slot del logo va vacío por ahora, así que el nombre accesible
                del enlace lo tiene que aportar el aria-label. */}
            <Link to="/" aria-label="Urbanos & Rurales — Ir al inicio">
              <Logo variant={solido ? 'dark' : 'light'} />
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <NavLinks claseEnlace={claseEnlace} />
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link to="/inmuebles?operacion=arriendo">
                <Button variant={solido ? 'secondary' : 'outline-light'} size="sm">
                  Buscar inmueble
                </Button>
              </Link>
              <AnchorLink anchor="consignar">
                <Button variant="primary" size="sm">
                  Consignar
                </Button>
              </AnchorLink>
            </div>

            <button
              type="button"
              onClick={() => setDrawerAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={drawerAbierto}
              className={['p-2 md:hidden', solido ? 'text-text-primary' : 'text-white'].join(' ')}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </Container>
      </header>

      <MobileDrawer abierto={drawerAbierto} onCerrar={() => setDrawerAbierto(false)} />
    </>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores. El header todavía no se ve en pantalla; se monta en la Tarea 10.

- [ ] **Step 3: Commit**

```bash
git add FrontEndUrbanos/src/app/layouts/public/Header.tsx
git commit -m "feat(public): header de dos modos con comportamiento de scroll

El modo se deriva de la ruta activa: transparente solo en la landing, donde
hay un hero debajo, y solido desde el primer pixel en el resto."
```

---

## Task 8: `Footer`

**Files:**
- Create: `FrontEndUrbanos/src/app/layouts/public/Footer.tsx`

**Interfaces:**
- Consumes: `site` y `Logo` (Tarea 4), `AnchorLink` (Tarea 5), `Container` (Tarea 2)
- Produce: `Footer()` sin props — la consume la Tarea 10

- [ ] **Step 1: Crear el componente**

```tsx
import { Link } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { Container } from '@/shared/components/ui/Container'
import { Logo } from '@/shared/components/ui/Logo'
import { site } from '@/shared/config/site'

/**
 * Pie del sitio público. Junto al overlay del hero, la única superficie oscura
 * del diseño.
 *
 * Solo figura la sede de Bogotá: la oficina de Medellín que mencionaba el
 * documento de UX/UI original no existe.
 */
const claseEnlace = 'text-text-muted-inverse transition-colors hover:text-white'

const redes = [
  { nombre: 'Facebook', url: site.redes.facebook },
  { nombre: 'Instagram', url: site.redes.instagram },
  { nombre: 'YouTube', url: site.redes.youtube },
  { nombre: 'LinkedIn', url: site.redes.linkedin },
]

export function Footer() {
  return (
    <footer id="contacto" className="bg-surface-dark">
      <Container width="wide">
        <div className="grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" aria-label={`${site.nombreCorto} — Ir al inicio`}>
              <Logo variant="light" />
            </Link>
            <p className="mt-4 text-sm text-text-muted-inverse">{site.lema}</p>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold tracking-[1.5px] text-white uppercase">
              Servicios
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li>
                <Link to="/inmuebles?operacion=arriendo" className={claseEnlace}>
                  Arrendar
                </Link>
              </li>
              <li>
                <Link to="/inmuebles?operacion=venta" className={claseEnlace}>
                  Comprar
                </Link>
              </li>
              <li>
                <AnchorLink anchor="consignar" className={claseEnlace}>
                  Consignar
                </AnchorLink>
              </li>
              <li>
                <AnchorLink anchor="servicios" className={claseEnlace}>
                  Avalúos
                </AnchorLink>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold tracking-[1.5px] text-white uppercase">
              Contacto
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li>
                <a href={`tel:${site.contacto.telefono.replace(/[^\d+]/g, '')}`} className={claseEnlace}>
                  {site.contacto.telefono}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${site.contacto.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={claseEnlace}
                >
                  {site.contacto.whatsappVisible}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contacto.email}`} className={claseEnlace}>
                  {site.contacto.email}
                </a>
              </li>
              <li className="text-text-muted-inverse">
                {site.direccion.calle}
                <br />
                {site.direccion.edificio}
                <br />
                {site.direccion.ciudad}, {site.direccion.pais}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold tracking-[1.5px] text-white uppercase">
              Síguenos
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {redes.map((red) => (
                <li key={red.nombre}>
                  <a
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={claseEnlace}
                  >
                    {red.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <div className="bg-surface-darker">
        <Container width="wide">
          <div className="flex flex-col gap-3 py-5 text-xs text-text-muted-inverse sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {site.razonSocial}. Todos los derechos reservados.
            </p>
            <a
              href={site.legal.politicaPrivacidad}
              target="_blank"
              rel="noopener noreferrer"
              className={claseEnlace}
            >
              Política de Privacidad y Datos
            </a>
          </div>
        </Container>
      </div>
    </footer>
  )
}
```

El `id="contacto"` del `<footer>` es lo que hace funcionar el item "Contacto" del menú.

Los enlaces legales quedan reducidos a la política que sí existe y está publicada. No se añade un enlace a "Términos y Condiciones": esa página no existe y apuntarla a ninguna parte sería peor que omitirla. Se añadirá en el sub-proyecto 4.

- [ ] **Step 2: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add FrontEndUrbanos/src/app/layouts/public/Footer.tsx
git commit -m "feat(public): footer oscuro de cuatro columnas

Todos los datos salen de shared/config/site. Solo figura la sede de Bogota:
la oficina de Medellin del documento original no existe."
```

---

## Task 9: `WhatsAppFab`

**Files:**
- Create: `FrontEndUrbanos/src/shared/components/WhatsAppFab.tsx`

**Interfaces:**
- Consumes: `site` (Tarea 4)
- Produce: `WhatsAppFab()` sin props — la consume la Tarea 10

- [ ] **Step 1: Crear el componente**

```tsx
import { useEffect, useState } from 'react'
import { site } from '@/shared/config/site'

/**
 * Botón flotante de contacto por WhatsApp.
 *
 * No aparece de inmediato: espera dos segundos o el primer scroll, lo que
 * ocurra antes, para no competir con el hero en el primer vistazo.
 */
const RETARDO_MS = 2000

const MENSAJE = 'Hola, vengo del sitio web y quiero información sobre un inmueble.'

export function WhatsAppFab() {
  const [visible, setVisible] = useState(false)

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

  const url = `https://wa.me/${site.contacto.whatsapp}?text=${encodeURIComponent(MENSAJE)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className={[
        'group fixed right-6 bottom-6 z-50 flex items-center gap-3',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      <span className="hidden rounded-control bg-surface px-3 py-2 text-xs text-text-secondary shadow-dropdown group-hover:block">
        Respondemos en segundos
      </span>

      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] sm:h-14 sm:w-14">
        <svg
          className="h-6 w-6 text-white sm:h-7 sm:w-7"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.887-9.885 9.887m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.465 3.488" />
        </svg>
      </span>
    </a>
  )
}
```

El listener de scroll usa `once: true`: se autodesregistra tras el primer disparo. El `removeEventListener` de la limpieza cubre el caso de que el componente se desmonte antes de que llegue a dispararse.

`#25D366` va como valor literal y no como token: es el verde de marca de WhatsApp, no un color del design system.

Las medidas son 48px en móvil y 56px de `sm:` en adelante, lo que satisface el mínimo táctil de 44px en ambos casos.

- [ ] **Step 2: Verificar**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add FrontEndUrbanos/src/shared/components/WhatsAppFab.tsx
git commit -m "feat(shared): boton flotante de WhatsApp

Aparece a los dos segundos o al primer scroll, lo que ocurra antes, para no
competir con el hero en el primer vistazo."
```

---

## Task 10: Ensamblar `PublicLayout`

**Files:**
- Modify: `FrontEndUrbanos/src/app/layouts/PublicLayout.tsx` (reescritura completa)

**Interfaces:**
- Consumes: `Header` (Tarea 7), `Footer` (Tarea 8), `WhatsAppFab` (Tarea 9)
- Produce: el shell completo. Es la última tarea del sub-proyecto.

- [ ] **Step 1: Reescribir el layout**

Reemplazar el contenido completo de `src/app/layouts/PublicLayout.tsx` por:

```tsx
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from '@/app/layouts/public/Footer'
import { Header } from '@/app/layouts/public/Header'
import { WhatsAppFab } from '@/shared/components/WhatsAppFab'

/**
 * Shell del sitio público: solo ensambla las piezas.
 *
 * El header es `fixed`, así que no ocupa espacio en el flujo. En la landing eso
 * es lo que se busca — flota sobre el hero. En el resto de rutas hay que
 * compensar con un padding superior, o el contenido arrancaría debajo de él.
 */
export function PublicLayout() {
  const location = useLocation()
  const esLanding = location.pathname === '/'

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-text-primary">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-dropdown"
      >
        Saltar al contenido
      </a>

      <Header />

      <main id="contenido" className={['flex-1', esLanding ? '' : 'pt-20'].join(' ')}>
        <Outlet />
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  )
}
```

El `pt-20` condicional resuelve un problema real: con el header en `fixed`, en cualquier ruta que no sea la landing el contenido empezaría tapado por él.

- [ ] **Step 2: Verificar que compila**

```bash
pnpm lint
pnpm build
```

Esperado: sin errores.

- [ ] **Step 3: Verificación visual completa**

`pnpm dev`. Recorrer esta lista con las herramientas de desarrollo abiertas, probando a 320, 768, 1024 y 1440px de ancho:

**En `/` (landing):**
1. El header arranca transparente. Como la `HomePage` todavía es el placeholder sobre fondo blanco, el texto blanco del header apenas se verá — **es lo esperado en este sub-proyecto**; el hero llega en el sub-proyecto 3.
2. Al bajar más de 40px, el header se vuelve blanco, se compacta de `py-5` a `py-3` y aparece su sombra.
3. El contenido arranca justo bajo el borde superior de la ventana, sin `pt-20`.

**En `/properties`:**
4. El header está blanco y sólido desde el primer píxel.
5. El contenido no queda tapado por el header.

**Menú:**
6. "Arrendar" es el primer item y es el que apunta a `/inmuebles?operacion=arriendo`.
7. "Contacto" hace scroll suave al footer.
8. "Consignar" y "Servicios" no hacen nada visible — sus secciones aún no existen. **No debe aparecer ningún error en consola.**
9. Desde `/properties`, pulsar "Contacto" navega a `/` y después hace scroll al footer.

**Drawer, por debajo de 768px:**
10. El botón hamburguesa abre el panel desde la derecha.
11. `Esc` lo cierra y el foco vuelve al botón hamburguesa.
12. Un clic en el fondo oscuro lo cierra.
13. Con el panel abierto, `Tab` repetido cicla dentro del panel y nunca alcanza el contenido de detrás.
14. Con el panel abierto, la página de detrás no hace scroll.
15. Pulsar un item del menú cierra el panel y navega.

**Footer:**
16. Cuatro columnas a 1440px, dos a 768px, una a 320px.
17. Los enlaces pasan de gris a blanco al pasar el puntero.
18. El teléfono, el correo y las redes apuntan a los valores reales de `site.ts`.
19. El slot del logo está vacío — **es lo correcto**, no un fallo de carga.

**WhatsApp:**
20. Aparece a los ~2 segundos, o antes si se hace scroll.
21. Al pasar el puntero muestra "Respondemos en segundos".
22. Al pulsarlo abre `wa.me` con el mensaje precargado, en una pestaña nueva.
23. Mide 48px en móvil y 56px en escritorio.

**Teclado y accesibilidad:**
24. `Tab` desde el inicio de la página revela primero "Saltar al contenido"; al activarlo, el foco salta al `<main>`.
25. Todo elemento interactivo muestra un contorno verde de 2px al recibir foco.

**Admin, comprobación de no-regresión:**
26. `/admin/login` sigue funcionando y se ve verde. Ningún archivo bajo `src/features/admin/` fue modificado en todo el sub-proyecto — confirmarlo con `git diff --stat main -- FrontEndUrbanos/src/features/admin/`, que debe salir vacío.

- [ ] **Step 4: Commit**

```bash
git add FrontEndUrbanos/src/app/layouts/PublicLayout.tsx
git commit -m "feat(public): ensambla el shell publico

PublicLayout queda reducido a ensamblar header, main, footer y FAB. El
padding superior es condicional: con el header en fixed, solo las rutas que
no son la landing necesitan compensarlo."
```

---

## Definición de terminado

- [ ] `pnpm lint` y `pnpm build` pasan sin errores
- [ ] Los 26 puntos de la verificación visual de la Tarea 10 se comprobaron
- [ ] `git diff --stat main -- FrontEndUrbanos/src/features/admin/` sale vacío
- [ ] No hay ningún gradiente en el código añadido
- [ ] Ningún teléfono, correo, dirección ni red social aparece literal fuera de `site.ts`
- [ ] Los dos `TODO(cliente):` — logo y años de trayectoria — siguen en su sitio, sin rellenar

## Lo que queda abierto para el cliente

1. **El archivo del logo.** Al llegar, se sustituye el contenido de `Logo.tsx` y nada más: ni el header ni el footer cambian.
2. **Los años de trayectoria.** "Desde 1996" o "18 años"; en 2026 no cuadran entre sí. Ninguna superficie muestra la cifra hasta que se confirme.
