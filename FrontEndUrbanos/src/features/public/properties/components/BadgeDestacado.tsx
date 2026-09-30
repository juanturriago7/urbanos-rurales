import { Star } from 'lucide-react'

/**
 * Distintivo de inmueble destacado (RF-078) sobre la foto de la tarjeta pública.
 * Va arriba a la derecha para no chocar con el badge de operación (Venta/Arriendo),
 * que ocupa la esquina izquierda. El contenedor padre debe ser `relative`.
 */
export function BadgeDestacado() {
  return (
    <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-[#001124]/85 px-3 py-1.5 text-[11px] font-bold tracking-[0.33px] text-white backdrop-blur-sm">
      <Star className="h-3 w-3 fill-[#f5b301] text-[#f5b301]" aria-hidden="true" />
      Destacado
    </span>
  )
}
