import { useState } from 'react'
import { useCrearUbicacion, useUbicacionesAdmin } from '@/features/admin/catalogos/hooks/useUbicacionesAdmin'
import { UbicacionTreeEditor } from '@/features/admin/catalogos/components/UbicacionTreeEditor'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'

/**
 * Página admin de ubicaciones: alta/baja de zonas, localidades, UPZs.
 *
 * Consume `GET /api/admin/catalogos/ubicaciones` (no el público) porque
 * debe ver también nodos inactivos para poder reactivarlos. Cualquier
 * mutación invalida ambas queries — la pública y la admin — para que
 * el selector del formulario de inmueble vea los cambios sin recargar.
 *
 * RF-005 / spec 01 (`Task/Specs/01-catalogo-ubicaciones.md`).
 */
export function UbicacionesAdminPage() {
  const { data: arbol, isLoading, isError, error } = useUbicacionesAdmin()
  const [nombreZona, setNombreZona] = useState('')
  const crear = useCrearUbicacion()

  function crearZona() {
    const nombre = nombreZona.trim()
    if (!nombre) return
    crear.mutate(
      { tipo: 'zona', nombre, padreId: null },
      { onSuccess: () => setNombreZona('') },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Ubicaciones</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Alta y baja de zonas, localidades y UPZs. Los cambios se reflejan de inmediato
          en el selector del formulario de inmuebles.
        </p>
      </div>

      {/* Alta de zona raíz */}
      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Nueva zona
        </h3>
        <p className="mt-1 text-xs text-text-secondary">
          Ej. Cundinamarca, Meta, Valle del Cauca, Costa Caribe.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={nombreZona}
            onChange={(e) => setNombreZona(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') crearZona()
            }}
            placeholder="Nombre de la zona"
            disabled={crear.isPending}
            className="rounded-control border border-border px-3 py-2 text-sm transition-colors focus:border-b-2 focus:border-b-brand-600 focus:outline-none disabled:bg-surface-muted"
          />
          <Button onClick={crearZona} isLoading={crear.isPending} size="md">
            + nueva zona
          </Button>
          {crear.isError && (
            <span className="text-xs text-error">
              {crear.error instanceof Error ? crear.error.message : 'Error al crear la zona.'}
            </span>
          )}
        </div>
      </section>

      {/* Árbol */}
      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Árbol de ubicaciones
        </h3>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {isError && (
          <div className="rounded-control border border-red-200 bg-red-50 p-4 text-sm text-error">
            Error al cargar las ubicaciones:{' '}
            {error instanceof Error ? error.message : 'Error desconocido'}
          </div>
        )}

        {arbol && <UbicacionTreeEditor arbol={arbol} />}
      </section>
    </div>
  )
}
