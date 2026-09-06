import { useMutation } from '@tanstack/react-query'
import { crearLead } from '@/features/public/contacto/api/leadsApi'

export function useCrearLead() {
  return useMutation({
    mutationFn: crearLead,
  })
}
