/**
 * Optimiza las fotos de la carpeta FOTOS (fuera del repo) para el sitio público.
 *
 * - Endereza cada foto según su EXIF y la recorta/redimensiona a las medidas
 *   exactas que usa el front (fit: cover).
 * - Convierte a WebP (páginas) o JPG (imagen Open Graph).
 * - Quita TODOS los metadatos: sharp no copia EXIF/XMP/IPTC salvo que se le
 *   pida keepMetadata(), así que las coordenadas GPS del dron y de los
 *   teléfonos no llegan al sitio.
 * - Verifica medidas, peso máximo y ausencia de metadatos de cada salida.
 *
 * Uso (desde FrontEndUrbanos/):
 *   pnpm fotos:optimizar              genera y verifica
 *   pnpm fotos:optimizar --verificar  solo verifica lo ya generado
 *
 * Origen: $FOTOS_ORIGEN o, por defecto, la carpeta FOTOS tres niveles por
 * encima de FrontEndUrbanos/ (D:\Programacion\urbanos-rurales\FOTOS).
 * Los originales NO se versionan; solo las salidas.
 */
import { access, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const raizFront = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const origen = path.resolve(
  process.env.FOTOS_ORIGEN ?? path.join(raizFront, '..', '..', '..', 'FOTOS'),
)

const DESTINOS = {
  assets: path.join(raizFront, 'src', 'assets', 'fotos'),
  og: path.join(raizFront, 'public', 'og'),
}

const wa = (hora) => `WhatsApp Image 2026-09-25 at ${hora}.jpeg`
const DRON_TERRITORIO = 'DJI_20240506192429_0637_D.JPG'
const DRON_PALMA_RIO = 'DJI_20240506171629_0599_D.JPG'

/**
 * Una fila por archivo de salida.
 * - ancho/alto: medida final exacta; si no coincide con la proporción del
 *   original, se recorta (fit: cover) conservando `posicion`.
 * - posicion: 'centre' (defecto), 'north', 'south', 'east', 'west' o
 *   'attention' (sharp elige la zona con más detalle).
 * - calidad: WebP 78 / JPG 80 por defecto. Si una salida se pasa de maxKB,
 *   bájala a 70 en esa fila.
 * - destino: 'assets' (defecto) u 'og'.
 */
const SALIDAS = [
  // Hero de la Home: panorámica del territorio (16:9) + recorte vertical para móvil
  {
    entrada: DRON_TERRITORIO,
    salida: 'hero-territorio-1920.webp',
    ancho: 1920,
    alto: 1080,
    maxKB: 400,
  },
  {
    entrada: DRON_TERRITORIO,
    salida: 'hero-territorio-1280.webp',
    ancho: 1280,
    alto: 720,
    maxKB: 200,
  },
  {
    entrada: DRON_TERRITORIO,
    salida: 'hero-territorio-movil-900.webp',
    ancho: 900,
    alto: 1200,
    maxKB: 180,
    calidad: 70,
  },
  // Imagen para compartir en redes (Open Graph): JPG, URL fija en public/
  {
    entrada: DRON_TERRITORIO,
    salida: 'urbanos-rurales-og.jpg',
    ancho: 1200,
    alto: 630,
    maxKB: 200,
    destino: 'og',
  },
  // Hero de la página Quiénes somos: plantación de palma junto al río
  {
    entrada: DRON_PALMA_RIO,
    salida: 'rural-palma-rio-1920.webp',
    ancho: 1920,
    alto: 1080,
    maxKB: 400,
    calidad: 50,
  },
  {
    entrada: DRON_PALMA_RIO,
    salida: 'rural-palma-rio-1280.webp',
    ancho: 1280,
    alto: 720,
    maxKB: 200,
    calidad: 50,
  },
  // Cabecera de /inmuebles: camino entre palmas (el original ya viene a 1600 px)
  {
    entrada: wa('09.45.24'),
    salida: 'camino-palmas-1600.webp',
    ancho: 1600,
    alto: 900,
    maxKB: 250,
    calidad: 36,
  },
  {
    entrada: wa('09.45.24'),
    salida: 'camino-palmas-960.webp',
    ancho: 960,
    alto: 540,
    maxKB: 100,
    calidad: 36,
  },
  // Tarjeta Comercialización de la Home: cenital de palmas, 4:3
  {
    entrada: wa('09.45.24 (2)'),
    salida: 'comercializacion-cenital-800.webp',
    ancho: 800,
    alto: 600,
    maxKB: 120,
    calidad: 50,
  },
  // Foto de equipo: 3:2 nativo, sin recorte para no cortar a nadie en los bordes
  { entrada: wa('09.47.35 (4)'), salida: 'equipo-1200.webp', ancho: 1200, alto: 800, maxKB: 220 },
  { entrada: wa('09.47.35 (4)'), salida: 'equipo-800.webp', ancho: 800, alto: 533, maxKB: 110 },
  // Reunión de trabajo (Quiénes somos): 16:9 nativo
  {
    entrada: wa('10.00.00'),
    salida: 'reunion-equipo-1280.webp',
    ancho: 1280,
    alto: 720,
    maxKB: 150,
  },
  { entrada: wa('10.00.00'), salida: 'reunion-equipo-800.webp', ancho: 800, alto: 450, maxKB: 80 },
  // Capacitación interna (Trabaja con nosotros): 16:9 nativo
  { entrada: wa('10.00.01'), salida: 'capacitacion-1280.webp', ancho: 1280, alto: 720, maxKB: 150 },
  { entrada: wa('10.00.01'), salida: 'capacitacion-800.webp', ancho: 800, alto: 450, maxKB: 80 },
]

function rutaSalida(s) {
  return path.join(DESTINOS[s.destino ?? 'assets'], s.salida)
}

async function generar(s) {
  const archivoEntrada = path.join(origen, s.entrada)
  const meta = await sharp(archivoEntrada).metadata()
  // Orientaciones EXIF 5-8 giran 90°: el ancho real es el alto almacenado.
  const girada = (meta.orientation ?? 1) >= 5
  const anchoOrigen = girada ? meta.height : meta.width
  const altoOrigen = girada ? meta.width : meta.height
  if (anchoOrigen < s.ancho || altoOrigen < s.alto) {
    throw new Error(
      `${s.entrada} (${anchoOrigen}×${altoOrigen}) es más pequeña que ${s.salida} ` +
        `(${s.ancho}×${s.alto}); no se amplían fotos.`,
    )
  }

  let tuberia = sharp(archivoEntrada)
    .rotate() // endereza según EXIF antes de descartar los metadatos
    .resize(s.ancho, s.alto, { fit: 'cover', position: s.posicion ?? 'centre' })

  tuberia = s.salida.endsWith('.jpg')
    ? tuberia.jpeg({ quality: s.calidad ?? 80, mozjpeg: true })
    : tuberia.webp({ quality: s.calidad ?? 78, effort: 6 })

  await tuberia.toFile(rutaSalida(s))
}

async function verificar(s) {
  const archivo = rutaSalida(s)
  const { size } = await stat(archivo)
  const meta = await sharp(archivo).metadata()
  const problemas = []
  if (meta.width !== s.ancho || meta.height !== s.alto) {
    problemas.push(`mide ${meta.width}×${meta.height}, se esperaba ${s.ancho}×${s.alto}`)
  }
  if (size > s.maxKB * 1024) {
    problemas.push(`pesa ${Math.round(size / 1024)} KB (máx. ${s.maxKB})`)
  }
  if (meta.exif || meta.xmp || meta.iptc) {
    problemas.push('conserva metadatos EXIF/XMP/IPTC')
  }
  return { salida: s.salida, kb: Math.round(size / 1024), problemas }
}

const soloVerificar = process.argv.includes('--verificar')

if (!soloVerificar) {
  try {
    await access(origen)
  } catch {
    console.error(`No encuentro la carpeta de origen: ${origen}`)
    console.error('Define FOTOS_ORIGEN con la ruta correcta.')
    process.exit(1)
  }
  await Promise.all(Object.values(DESTINOS).map((d) => mkdir(d, { recursive: true })))
  for (const s of SALIDAS) {
    await generar(s)
    console.log(`✓ ${s.salida}`)
  }
}

const resultados = []
for (const s of SALIDAS) resultados.push(await verificar(s))

console.table(
  resultados.map((r) => ({
    archivo: r.salida,
    KB: r.kb,
    estado: r.problemas.join('; ') || 'ok',
  })),
)
console.log(
  `Total: ${resultados.reduce((t, r) => t + r.kb, 0)} KB en ${resultados.length} archivos`,
)

if (resultados.some((r) => r.problemas.length > 0)) process.exit(1)
