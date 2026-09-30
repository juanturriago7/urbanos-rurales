// Capturas responsive con Playwright (Chromium headless) + detección de
// desborde horizontal. Herramienta de desarrollo, no se usa en la app.
//
// Primera vez: instala el navegador de Playwright con
//   pnpm exec playwright install chromium
//
// Uso (desde FrontEndUrbanos/, con `pnpm dev` corriendo en :5173). La ruta va
// SIN barra inicial (Git Bash la destrozaría); "home" es la raíz:
//   node scripts/capturas-responsive.mjs --ruta home --salida <dir>
//   node scripts/capturas-responsive.mjs --ruta inmuebles --anchos 375,768 \
//     --antes "document.querySelector('[aria-controls=panel-filtros]')?.click()" \
//     --nombre filtros-abiertos --salida <dir>
//
// Opciones:
//   --ruta     ruta sin barra inicial ("inmuebles/casa-en-chia"), "home" o URL completa
//   --anchos   lista separada por comas (por defecto 320,375,414,768,1024,1280,1440)
//   --alto     alto del viewport, entero > 0 (por defecto 800)
//   --antes    JS que se evalúa en la página antes de capturar (abrir un panel, un modal...)
//   --esperar  ms de espera tras cargar y tras --antes, entero >= 0 (por defecto 800)
//   --nombre   sufijo del archivo (por defecto derivado de la ruta)
//   --salida   carpeta de salida (obligatoria)
//   --viewport captura solo el viewport en lugar de la página completa
//
// Variables de entorno:
//   CAPTURAS_BASE  origen del sitio (por defecto http://localhost:5173)
//
// Por cada ancho imprime una línea: ancho, desborde (scrollWidth - clientWidth) y
// hasta 5 elementos cuyo borde derecho sale del viewport.
//
// Códigos de salida:
//   0  ningún ancho desborda
//   1  algún ancho desborda
//   2  error: argumentos inválidos, fallo de navegación u otra excepción

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

function leerArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const clave = argv[i]
    if (!clave.startsWith('--')) continue
    const nombre = clave.slice(2)
    const siguiente = argv[i + 1]
    if (siguiente === undefined || siguiente.startsWith('--')) {
      args[nombre] = true
    } else {
      args[nombre] = siguiente
      i++
    }
  }
  return args
}

async function main() {
  const args = leerArgs(process.argv)
  if (!args.ruta || !args.salida) {
    console.error('Faltan --ruta y/o --salida. Ver cabecera del script.')
    process.exit(2)
  }

  const base = process.env.CAPTURAS_BASE ?? 'http://localhost:5173'
  // En Git Bash, un argumento que empieza por "/" se convierte en una ruta de
  // Windows (C:/Program Files/Git/...). Por eso se acepta la ruta sin barra inicial
  // ("inmuebles", "" o "home" para la raíz) y la barra se añade aquí. Alternativa:
  // anteponer MSYS_NO_PATHCONV=1 al comando.
  const rutaLimpia = args.ruta === true || args.ruta === 'home' ? '' : String(args.ruta)
  const url = /^https?:\/\//.test(rutaLimpia)
    ? rutaLimpia
    : base + '/' + rutaLimpia.replace(/^\/+/, '')
  const anchos = String(args.anchos ?? '320,375,414,768,1024,1280,1440')
    .split(',')
    .map((a) => Number(a.trim()))
    .filter((a) => a > 0)

  const alto = Number(args.alto ?? 800)
  if (!Number.isFinite(alto) || alto <= 0) {
    console.error('--alto debe ser un número finito mayor que 0.')
    process.exit(2)
  }

  const esperar = Number(args.esperar ?? 800)
  if (!Number.isFinite(esperar) || esperar < 0) {
    console.error('--esperar debe ser un número finito mayor o igual que 0.')
    process.exit(2)
  }

  const nombre =
    args.nombre ??
    (rutaLimpia
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '') ||
      'home')
  mkdirSync(args.salida, { recursive: true })

  const navegador = await chromium.launch()
  let hayDesborde = false

  try {
    for (const ancho of anchos) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } })
      await pagina.goto(url, { waitUntil: 'networkidle' })
      await pagina.waitForTimeout(esperar)
      if (args.antes) {
        await pagina.evaluate(args.antes)
        await pagina.waitForTimeout(esperar)
      }

      const medida = await pagina.evaluate(() => {
        const doc = document.documentElement
        const vw = doc.clientWidth
        const culpables = []
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right > vw + 1) {
            const cls = typeof el.className === 'string' ? el.className.slice(0, 60) : ''
            culpables.push(`${el.tagName.toLowerCase()}.${cls} (right=${Math.round(r.right)})`)
          }
          if (culpables.length >= 5) break
        }
        return { desborde: doc.scrollWidth - vw, culpables }
      })

      const archivo = join(args.salida, `${nombre}-${ancho}.png`)
      await pagina.screenshot({ path: archivo, fullPage: !args.viewport })
      if (medida.desborde > 0) hayDesborde = true
      console.log(
        `${ancho}px  desborde=${medida.desborde}px  ${archivo}` +
          (medida.culpables.length ? `\n    fuera: ${medida.culpables.join(' | ')}` : ''),
      )
      await pagina.close()
    }
  } finally {
    await navegador.close()
  }

  process.exit(hayDesborde ? 1 : 0)
}

try {
  await main()
} catch (err) {
  console.error(err)
  process.exit(2)
}
