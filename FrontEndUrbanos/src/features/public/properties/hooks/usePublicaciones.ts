import { useQuery } from '@tanstack/react-query'
import {
  buscarInmuebles,
  type FiltroInmueblesPublico,
} from '@/features/public/properties/api/inmueblesPublicApi'

export function usePublicaciones(filtro: FiltroInmueblesPublico = {}) {
  return useQuery({
    queryKey: ['inmuebles-publico', filtro],
    queryFn: () => buscarInmuebles(filtro),
  })
}
