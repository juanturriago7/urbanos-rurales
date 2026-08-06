import { apiClient } from '@/shared/lib/axios'

/**
 * Galería de imágenes de un inmueble (RF-090 a RF-094).
 * Subida en tres pasos: 1) pedir URL prefirmada, 2) PUT directo al bucket,
 * 3) confirmar y registrar los metadatos. El binario nunca pasa por el backend.
 */

export interface ImagenDto {
  id: number
  urlCdn: string
  urlThumbnail: string | null
  formato: string
  pesoBytes: number | null
  orden: number
  esPortada: boolean
  textoAlt: string | null
}

interface UrlSubidaDto {
  urlSubida: string
  storageKey: string
  vigenciaSegundos: number
}

export const getImagenes = async (inmuebleId: number): Promise<ImagenDto[]> => {
  const { data } = await apiClient.get<ImagenDto[]>(
    `/api/admin/inmuebles/${inmuebleId}/imagenes`,
  )
  return data
}

const presignImagen = async (
  inmuebleId: number,
  nombreArchivo: string,
  contentType: string,
): Promise<UrlSubidaDto> => {
  const { data } = await apiClient.post<UrlSubidaDto>(
    `/api/admin/inmuebles/${inmuebleId}/imagenes/presign`,
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

const registrarImagen = async (
  inmuebleId: number,
  storageKey: string,
  textoAlt?: string | null,
): Promise<ImagenDto> => {
  const { data } = await apiClient.post<ImagenDto>(`/api/admin/inmuebles/${inmuebleId}/imagenes`, {
    storageKey,
    textoAlt,
  })
  return data
}

/** Flujo completo: presign, subida directa al bucket y registro de metadatos. */
export const subirImagen = async (
  inmuebleId: number,
  file: File,
  textoAlt?: string | null,
): Promise<ImagenDto> => {
  const contentType = file.type
  const { urlSubida, storageKey } = await presignImagen(inmuebleId, file.name, contentType)
  await subirArchivo(urlSubida, contentType, file)
  return registrarImagen(inmuebleId, storageKey, textoAlt)
}

export const marcarPortada = async (inmuebleId: number, imagenId: number): Promise<void> => {
  await apiClient.put(`/api/admin/inmuebles/${inmuebleId}/imagenes/${imagenId}/portada`)
}

export const eliminarImagen = async (inmuebleId: number, imagenId: number): Promise<void> => {
  await apiClient.delete(`/api/admin/inmuebles/${inmuebleId}/imagenes/${imagenId}`)
}
