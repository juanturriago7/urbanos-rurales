import path from 'node:path'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { FOTOS } from '@/assets/fotos'

/**
 * Los imports de `.webp` en Vitest (entorno node) devuelven la ruta que
 * serviría el dev server, no la del archivo en disco, así que aquí se
 * resuelve cada entrada del catálogo a su archivo real por nombre: esta
 * tabla enlaza cada clave con el archivo de su variante más grande (la que
 * describen `ancho`/`alto` en el catálogo).
 */
const ARCHIVO_VARIANTE_MAYOR: Record<keyof typeof FOTOS, string> = {
  heroTerritorio: 'hero-territorio-1920.webp',
  portadaArticulo: 'hero-territorio-1280.webp',
  ruralPalmaRio: 'rural-palma-rio-1920.webp',
  cabeceraInmuebles: 'camino-palmas-1600.webp',
  comercializacion: 'comercializacion-cenital-800.webp',
  equipo: 'equipo-1200.webp',
  reunionEquipo: 'reunion-equipo-1280.webp',
  capacitacion: 'capacitacion-1280.webp',
}

const entradas = Object.entries(FOTOS) as [keyof typeof FOTOS, (typeof FOTOS)[keyof typeof FOTOS]][]

describe('catálogo de fotos vs. archivos reales', () => {
  it.each(entradas)(
    '%s: el archivo de la variante más grande mide ancho x alto exactos',
    async (clave, foto) => {
      const archivo = ARCHIVO_VARIANTE_MAYOR[clave]
      const ruta = path.join(import.meta.dirname, archivo)
      const metadatos = await sharp(ruta).metadata()

      expect(metadatos.width).toBe(foto.ancho)
      expect(metadatos.height).toBe(foto.alto)
    },
  )
})
