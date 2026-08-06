import { useQuery } from '@tanstack/react-query'
import {
  buscarUbicaciones,
  getCaracteristicas,
  getTiposInmueble,
  getUbicaciones,
} from '@/features/admin/catalogos/api/catalogosApi'

export const catalogosQueryKeys = {
  tiposInmueble: ['catalogos', 'tipos-inmueble'] as const,
  ubicaciones: ['catalogos', 'ubicaciones'] as const,
  caracteristicas: ['catalogos', 'caracteristicas'] as const,
  buscarUbicaciones: (termino: string) => ['catalogos', 'ubicaciones', 'buscar', termino] as const,
}

/**
 * Los catálogos cambian muy poco, así que se marcan como frescos por una hora
 * para no repetir la petición cada vez que se abre el formulario.
 */
const UNA_HORA = 60 * 60 * 1000

export function useTiposInmueble() {
  return useQuery({
    queryKey: catalogosQueryKeys.tiposInmueble,
    queryFn: getTiposInmueble,
    staleTime: UNA_HORA,
  })
}

export function useUbicaciones() {
  return useQuery({
    queryKey: catalogosQueryKeys.ubicaciones,
    queryFn: getUbicaciones,
    staleTime: UNA_HORA,
  })
}

export function useCaracteristicas() {
  return useQuery({
    queryKey: catalogosQueryKeys.caracteristicas,
    queryFn: getCaracteristicas,
    staleTime: UNA_HORA,
  })
}

/**
 * Búsqueda de ubicaciones (barrios incluidos) por nombre. El componente le pasa el
 * término ya debounced, así que aquí solo se evita disparar con menos de 2 letras.
 */
export function useBuscarUbicaciones(termino: string) {
  const terminoNormalizado = termino.trim()

  return useQuery({
    queryKey: catalogosQueryKeys.buscarUbicaciones(terminoNormalizado),
    queryFn: () => buscarUbicaciones(terminoNormalizado),
    enabled: terminoNormalizado.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}
