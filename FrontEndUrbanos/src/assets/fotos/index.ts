/**
 * Catálogo de fotos del sitio público.
 *
 * Los .webp de esta carpeta los genera `pnpm fotos:optimizar` (ver
 * scripts/optimizar-fotos.mjs) a partir de la carpeta FOTOS, que no se
 * versiona. Aquí se juntan URL con hash de Vite, srcSet, medidas y alt, para
 * que ninguna página escriba esos datos a mano.
 */
import camino960 from './camino-palmas-960.webp'
import camino1600 from './camino-palmas-1600.webp'
import capacitacion800 from './capacitacion-800.webp'
import capacitacion1280 from './capacitacion-1280.webp'
import comercializacion800 from './comercializacion-cenital-800.webp'
import equipo800 from './equipo-800.webp'
import equipo1200 from './equipo-1200.webp'
import heroTerritorio1280 from './hero-territorio-1280.webp'
import heroTerritorio1920 from './hero-territorio-1920.webp'
import heroTerritorioMovil900 from './hero-territorio-movil-900.webp'
import reunion800 from './reunion-equipo-800.webp'
import reunion1280 from './reunion-equipo-1280.webp'
import ruralPalmaRio1280 from './rural-palma-rio-1280.webp'
import ruralPalmaRio1920 from './rural-palma-rio-1920.webp'

export interface FotoCatalogo {
  /** Variante por defecto (la que usan navegadores sin srcset). */
  src: string
  srcSet: string
  /** Recorte alternativo para pantallas < 768px (dirección de arte). */
  srcSetMovil?: string
  /** Medidas de la variante mayor: dan la proporción para evitar saltos (CLS). */
  ancho: number
  alto: number
  alt: string
}

function srcSet(variantes: Record<number, string>) {
  return Object.entries(variantes)
    .map(([ancho, url]) => `${url} ${ancho}w`)
    .join(', ')
}

const ALT_TERRITORIO =
  'Vista aérea de campos con lagunas y una vía recta que lleva hacia la ciudad'

export const FOTOS = {
  heroTerritorio: {
    src: heroTerritorio1280,
    srcSet: srcSet({ 1280: heroTerritorio1280, 1920: heroTerritorio1920 }),
    srcSetMovil: `${heroTerritorioMovil900} 900w`,
    ancho: 1920,
    alto: 1080,
    alt: ALT_TERRITORIO,
  },
  portadaArticulo: {
    src: heroTerritorio1280,
    srcSet: srcSet({ 1280: heroTerritorio1280 }),
    srcSetMovil: undefined,
    ancho: 1280,
    alto: 720,
    alt: ALT_TERRITORIO,
  },
  ruralPalmaRio: {
    src: ruralPalmaRio1280,
    srcSet: srcSet({ 1280: ruralPalmaRio1280, 1920: ruralPalmaRio1920 }),
    srcSetMovil: undefined,
    ancho: 1920,
    alto: 1080,
    alt: 'Vista aérea de una plantación de palma junto a un río',
  },
  cabeceraInmuebles: {
    src: camino960,
    srcSet: srcSet({ 960: camino960, 1600: camino1600 }),
    srcSetMovil: undefined,
    ancho: 1600,
    alto: 900,
    alt: 'Vista aérea de un camino rural entre cultivos de palma con una camioneta',
  },
  comercializacion: {
    src: comercializacion800,
    srcSet: srcSet({ 800: comercializacion800 }),
    srcSetMovil: undefined,
    ancho: 800,
    alto: 600,
    alt: 'Vista cenital de un camino entre cultivos de palma',
  },
  equipo: {
    src: equipo800,
    srcSet: srcSet({ 800: equipo800, 1200: equipo1200 }),
    srcSetMovil: undefined,
    ancho: 1200,
    alto: 800,
    alt: 'Equipo de Urbanos & Rurales reunido frente a un edificio de fachada de vidrio',
  },
  reunionEquipo: {
    src: reunion800,
    srcSet: srcSet({ 800: reunion800, 1280: reunion1280 }),
    srcSetMovil: undefined,
    ancho: 1280,
    alto: 720,
    alt: 'Reunión de trabajo del equipo interdisciplinario en la oficina',
  },
  capacitacion: {
    src: capacitacion800,
    srcSet: srcSet({ 800: capacitacion800, 1280: capacitacion1280 }),
    srcSetMovil: undefined,
    ancho: 1280,
    alto: 720,
    alt: 'Capacitación interna del equipo sobre calidad en el servicio',
  },
} satisfies Record<string, FotoCatalogo>
