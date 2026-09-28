import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agendarVisita } from '@/features/public/visitas/api/visitasApi'
import { disponibilidadVisitasKey } from '@/features/public/visitas/hooks/useDisponibilidadVisitas'

export function useAgendarVisita() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: agendarVisita,
    // Tras agendar (o si la franja ya estaba tomada) la disponibilidad cambió.
    onSettled: () => queryClient.invalidateQueries({ queryKey: disponibilidadVisitasKey }),
  })
}
