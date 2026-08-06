import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  eliminarImagen,
  getImagenes,
  marcarPortada,
  subirImagen,
} from '@/features/admin/properties/api/imagenesApi'

export const imagenesQueryKeys = {
  list: (inmuebleId: number) => ['inmuebles', inmuebleId, 'imagenes'] as const,
}

export function useImagenes(inmuebleId: number | null) {
  return useQuery({
    queryKey: imagenesQueryKeys.list(inmuebleId ?? 0),
    queryFn: () => getImagenes(inmuebleId as number),
    enabled: inmuebleId !== null,
  })
}

export function useSubirImagen(inmuebleId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => subirImagen(inmuebleId as number, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: imagenesQueryKeys.list(inmuebleId ?? 0) }),
  })
}

export function useMarcarPortada(inmuebleId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imagenId: number) => marcarPortada(inmuebleId as number, imagenId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: imagenesQueryKeys.list(inmuebleId ?? 0) }),
  })
}

export function useEliminarImagen(inmuebleId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imagenId: number) => eliminarImagen(inmuebleId as number, imagenId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: imagenesQueryKeys.list(inmuebleId ?? 0) }),
  })
}
