import { GaleriaImagenes } from '@/features/admin/properties/components/GaleriaImagenes'

interface TarjetaFotosProps {
  inmuebleId: number | null
}

/**
 * Card de fotos de la sidebar del form de inmueble. Antes de guardar el
 * registro no hay `inmuebleId` real todavía (RF-090..094 exige uno para
 * pedir la URL prefirmada), así que se muestra bloqueada; después, pasa a
 * ser la galería funcional en el mismo lugar.
 */
export function TarjetaFotos({ inmuebleId }: TarjetaFotosProps) {
  if (inmuebleId === null) {
    return (
      <section className="rounded-[--radius-card] border border-dashed border-border bg-white p-5 text-center shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Fotos <span className="font-normal normal-case">(opcional)</span>
        </h3>
        <p className="mt-3 text-xs text-text-secondary">
          Disponible después de guardar el inmueble.
        </p>
      </section>
    )
  }

  return <GaleriaImagenes inmuebleId={inmuebleId} />
}
