import { useState } from 'react'
import { useTiposInmueble } from '@/features/admin/catalogos/hooks/useCatalogos'
import {
  useActualizarTipoInmueble,
  useCrearTipoInmueble,
} from '@/features/admin/catalogos/hooks/useTiposInmuebleAdmin'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import type { TipoInmuebleDto } from '@/features/admin/catalogos/api/catalogosApi'

/**
 * Página admin de tipos de inmueble — CRUD sobre `tipos_inmueble`.
 * Spec 02. La marca "¿Es propiedad horizontal?" la usa la spec 03 para
 * mostrar/ocultar el campo "área de terreno" en la ficha técnica.
 */
export function TiposInmuebleAdminPage() {
  const { data: tipos, isLoading, isError, error } = useTiposInmueble()
  const crear = useCrearTipoInmueble()
  const actualizar = useActualizarTipoInmueble()

  const [nombre, setNombre] = useState('')
  const [esPH, setEsPH] = useState(true)
  const [editando, setEditando] = useState<number | null>(null)
  const [nombreEdit, setNombreEdit] = useState('')
  const [esPHEdit, setEsPHEdit] = useState(true)

  function crearTipo() {
    if (!nombre.trim()) return
    crear.mutate(
      { nombre: nombre.trim(), esPropiedadHorizontal: esPH },
      { onSuccess: () => setNombre('') },
    )
  }

  function guardarEdicion(t: TipoInmuebleDto) {
    if (!nombreEdit.trim()) return
    actualizar.mutate(
      {
        id: t.id,
        nombre: nombreEdit.trim(),
        esPropiedadHorizontal: esPHEdit,
        activo: t.activo,
        orden: 0,
      },
      { onSuccess: () => setEditando(null) },
    )
  }

  function toggleActivo(t: TipoInmuebleDto) {
    actualizar.mutate({
      id: t.id,
      nombre: t.nombre,
      esPropiedadHorizontal: t.esPropiedadHorizontal,
      activo: !t.activo,
      orden: 0,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Tipos de inmueble</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Crea tipos nuevos (ej. Edificio, Finca) y marca si son propiedad horizontal.
          Los cambios se reflejan de inmediato en el formulario de inmuebles y en los
          filtros públicos.
        </p>
      </div>

      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Nuevo tipo
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && crearTipo()}
            placeholder="Nombre (ej. Finca, Edificio)"
            disabled={crear.isPending}
            className="rounded-control border border-border px-3 py-2 text-sm transition-colors focus:border-b-2 focus:border-b-brand-600 focus:outline-none disabled:bg-surface-muted"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={esPH}
              onChange={(e) => setEsPH(e.target.checked)}
              disabled={crear.isPending}
              className="h-4 w-4 accent-[#004b98]"
            />
            <span>Es propiedad horizontal</span>
          </label>
          <Button onClick={crearTipo} isLoading={crear.isPending}>+ crear tipo</Button>
          {crear.isError && (
            <span className="text-xs text-error">
              {crear.error instanceof Error ? crear.error.message : 'Error al crear.'}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Un apartamento, oficina o local suele ser PH; una casa, lote o edificio
          completo normalmente no.
        </p>
      </section>

      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Tipos registrados
        </h3>

        {isLoading && (
          <div className="flex justify-center py-8"><Spinner size="md" /></div>
        )}
        {isError && (
          <div className="rounded-control border border-red-200 bg-red-50 p-4 text-sm text-error">
            Error: {error instanceof Error ? error.message : 'desconocido'}
          </div>
        )}

        {tipos && tipos.length === 0 && (
          <p className="rounded-control border border-dashed border-border p-6 text-center text-sm text-text-secondary">
            Aún no hay tipos.
          </p>
        )}

        {tipos && tipos.length > 0 && (
          <ul className="divide-y divide-border">
            {tipos.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                {editando === t.id ? (
                  <>
                    <input
                      value={nombreEdit}
                      onChange={(e) => setNombreEdit(e.target.value)}
                      autoFocus
                      className="rounded-control border border-border px-2 py-1 text-sm focus:border-b-2 focus:border-b-brand-600 focus:outline-none"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={esPHEdit}
                        onChange={(e) => setEsPHEdit(e.target.checked)}
                        className="h-4 w-4 accent-[#004b98]"
                      />
                      <span>PH</span>
                    </label>
                    <Button size="sm" variant="primary" onClick={() => guardarEdicion(t)}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={t.activo ? 'text-sm' : 'text-sm text-text-secondary line-through'}>
                      {t.nombre}
                    </span>
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                      {t.esPropiedadHorizontal ? 'PH' : 'no PH'}
                    </span>
                    <span className="text-xs text-text-secondary">/{t.slug}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditando(t.id)
                        setNombreEdit(t.nombre)
                        setEsPHEdit(t.esPropiedadHorizontal)
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActivo(t)}
                      className={t.activo ? 'text-error hover:bg-red-50' : 'text-brand-700'}
                    >
                      {t.activo ? 'Desactivar' : 'Reactivar'}
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
