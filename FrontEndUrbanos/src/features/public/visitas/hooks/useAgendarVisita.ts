import { useMutation } from '@tanstack/react-query'
import { agendarVisita } from '@/features/public/visitas/api/visitasApi'

export function useAgendarVisita() {
  return useMutation({
    mutationFn: agendarVisita,
  })
}
