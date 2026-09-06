import { apiClient } from '@/shared/lib/axios'

/**
 * Portada de un artículo (spec 06 + MinIO). Mismo patrón en tres pasos que
 * features/admin/properties/api/imagenesApi.ts: 1) URL prefirmada,
 * 2) PUT directo al bucket, 3) confirmar y fijar la portada en el artículo.
 * El binario nunca pasa por el backend.
 */

interface UrlSubidaDto {
  urlSubida: string
  storageKey: string
  vigenciaSegundos: number
}

const presignImagenPortada = async (
  articuloId: number,
  nombreArchivo: string,
  contentType: string,
): Promise<UrlSubidaDto> => {
  const { data } = await apiClient.post<UrlSubidaDto>(
    `/api/admin/blog/${articuloId}/imagen-portada/presign`,
    { nombreArchivo, contentType },
  )
  return data
}

/**
 * Sube el binario directo al bucket con la URL prefirmada. Nunca pasa por
 * apiClient a propósito: es una URL absoluta hacia el storage con su propia
 * firma, no lleva el bearer token del panel ni el baseURL de la API.
 */
const subirArchivo = async (urlSubida: string, contentType: string, file: File): Promise<void> => {
  const respuesta = await fetch(urlSubida, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!respuesta.ok) {
    throw new Error(`No se pudo subir la imagen al almacenamiento (HTTP ${respuesta.status}).`)
  }
}

const confirmarImagenPortada = async (articuloId: number, storageKey: string): Promise<string> => {
  const { data } = await apiClient.put<{ imagenPortadaUrl: string }>(
    `/api/admin/blog/${articuloId}/imagen-portada`,
    { storageKey },
  )
  return data.imagenPortadaUrl
}

/** Flujo completo: presign, subida directa al bucket y confirmación. Devuelve la URL pública final. */
export const subirImagenPortada = async (articuloId: number, file: File): Promise<string> => {
  const contentType = file.type
  const { urlSubida, storageKey } = await presignImagenPortada(articuloId, file.name, contentType)
  await subirArchivo(urlSubida, contentType, file)
  return confirmarImagenPortada(articuloId, storageKey)
}
