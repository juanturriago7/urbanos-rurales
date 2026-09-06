/**
 * Formulario "Trabaja con nosotros" (spec 07) — flujo de subida real del CV en
 * PDF, mismo patrón en tres pasos que features/admin/properties/api/imagenesApi.ts:
 * 1) URL prefirmada, 2) PUT directo al bucket, 3) crear la postulación.
 * El binario nunca pasa por el backend. Sin autenticación: cualquiera puede
 * postularse.
 */

interface UrlSubidaDto {
  urlSubida: string
  storageKey: string
  vigenciaSegundos: number
}

export interface CrearPostulacionInput {
  nombre: string
  correo: string
  telefono?: string | null
  cargoInteres?: string | null
  mensaje?: string | null
  cvStorageKey: string
}

async function leerError(resp: Response, fallback: string): Promise<never> {
  const data = await resp.json().catch(() => null)
  throw new Error(data?.detail ?? data?.title ?? fallback)
}

const presignCv = async (nombreArchivo: string, contentType: string): Promise<UrlSubidaDto> => {
  const resp = await fetch('/api/postulaciones/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreArchivo, contentType }),
  })
  if (!resp.ok) await leerError(resp, 'No se pudo autorizar la subida del CV.')
  return resp.json()
}

/**
 * Sube el binario directo al bucket con la URL prefirmada. `fetch` plano a
 * propósito: es una URL absoluta hacia el storage con su propia firma, no
 * lleva ningún header de la API.
 */
const subirArchivo = async (urlSubida: string, contentType: string, file: File): Promise<void> => {
  const respuesta = await fetch(urlSubida, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!respuesta.ok) {
    throw new Error(`No se pudo subir el CV al almacenamiento (HTTP ${respuesta.status}).`)
  }
}

const crearPostulacion = async (input: CrearPostulacionInput): Promise<{ id: number }> => {
  const resp = await fetch('/api/postulaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!resp.ok) await leerError(resp, 'Error al enviar la postulación.')
  return resp.json()
}

/** Flujo completo: presign, subida directa al bucket, y creación de la postulación. */
export const enviarPostulacion = async (
  datos: Omit<CrearPostulacionInput, 'cvStorageKey'>,
  cv: File,
): Promise<{ id: number }> => {
  const { urlSubida, storageKey } = await presignCv(cv.name, cv.type)
  await subirArchivo(urlSubida, cv.type, cv)
  return crearPostulacion({ ...datos, cvStorageKey: storageKey })
}
