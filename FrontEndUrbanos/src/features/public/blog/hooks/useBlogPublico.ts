import { useQuery } from '@tanstack/react-query'
import {
  listarArticulosPublico,
  obtenerArticuloPorSlug,
} from '@/features/public/blog/api/blogPublicoApi'

export function useArticulosPublico(page = 1, pageSize = 9) {
  return useQuery({
    queryKey: ['blog', 'publico', page, pageSize],
    queryFn: () => listarArticulosPublico(page, pageSize),
  })
}

export function useArticuloPorSlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['blog', 'publico', 'slug', slug],
    queryFn: () => obtenerArticuloPorSlug(slug as string),
    enabled: Boolean(slug),
  })
}
