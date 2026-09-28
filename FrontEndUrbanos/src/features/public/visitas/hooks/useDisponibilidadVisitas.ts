import { useQuery } from '@tanstack/react-query'
import { getDisponibilidadVisitas } from '@/features/public/visitas/api/visitasApi'

export const disponibilidadVisitasKey = ['visitas', 'disponibilidad'] as const

export function useDisponibilidadVisitas(fecha: string) {
  return useQuery({
    queryKey: [...disponibilidadVisitasKey, fecha],
    queryFn: () => getDisponibilidadVisitas(fecha),
    enabled: Boolean(fecha),
    staleTime: 30_000,
  })
}
