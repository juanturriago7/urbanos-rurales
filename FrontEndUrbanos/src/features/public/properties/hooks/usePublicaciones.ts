import { useQuery } from '@tanstack/react-query'
import {
  buscarInmuebles,
  obtenerInmueblePorSlug,
  type FiltroInmueblesPublico,
} from '@/features/public/properties/api/inmueblesPublicApi'

export function usePublicaciones(filtro: FiltroInmueblesPublico = {}) {
  return useQuery({
    queryKey: ['inmuebles-publico', filtro],
    queryFn: () => buscarInmuebles(filtro),
  })
}

export function useInmuebleDetalle(slug: string | undefined) {
  return useQuery({
    queryKey: ['inmueble-detalle', slug],
    queryFn: () => obtenerInmueblePorSlug(slug as string),
    enabled: Boolean(slug),
  })
}
