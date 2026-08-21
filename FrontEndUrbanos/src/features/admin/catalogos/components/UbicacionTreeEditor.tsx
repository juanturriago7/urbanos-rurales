import { useState } from 'react'
import type { UbicacionDto } from '@/features/admin/catalogos/api/catalogosApi'
import {
  useActualizarUbicacion,
  useCrearUbicacion,
} from '@/features/admin/catalogos/hooks/useUbicacionesAdmin'
import { Button } from '@/shared/components/ui/Button'

/**
 * Conjetura sobre el tipo del hijo inmediato al crear un nuevo nodo.
 * No es una regla de BD (la jerarquía es por convención) pero refleja cómo
 * se usan los 4 valores hoy en el árbol de Bogotá: zona → localidad →
 * upz → barrio. Si el padre es `barrio`, no se permite agregar hijos.
 */
const SIGUIENTE_TIPO: Record<UbicacionDto['tipo'], UbicacionDto['tipo'] | null> = {
  zona: 'localidad',
  localidad: 'upz',
  upz: 'barrio',
  barrio: null,
}

const ETIQUETA_TIPO: Record<UbicacionDto['tipo'], string> = {
  zona: 'Zona',
  localidad: 'Localidad',
  upz: 'UPZ',
  barrio: 'Barrio',
}

interface NodoUbicacionProps {
  nodo: UbicacionDto
  nivel: number
}

/**
 * Renderiza un nodo del árbol y (recursivamente) sus hijos.
 *
 * Notas de implementación:
 * - El `padreId` del nodo se envía tal cual del DTO en cualquier mutación.
 *   Enviar `null` reubicaría el nodo a la raíz — el plan original tenía
 *   ese bug y por eso el DTO ahora expone `padreId`.
 * - La confirmación para desactivar un nodo con hijos activos vive aquí
 *   (no en backend): el backend exige `desactivarHijos: true` en el body,
 *   y nosotros decidimos cuándo pedirle al usuario esa confirmación.
 */
function NodoUbicacion({ nodo, nivel }: NodoUbicacionProps) {
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(nodo.nombre)
  const [agregandoHijo, setAgregandoHijo] = useState(false)
  const [nombreHijo, setNombreHijo] = useState('')

  const crear = useCrearUbicacion()
  const actualizar = useActualizarUbicacion()

  const tipoHijo = SIGUIENTE_TIPO[nodo.tipo]
  const tieneHijosActivos = nodo.hijos.some((h) => h.activo)

  function guardarNombre() {
    if (!nombreEdit.trim()) return
    actualizar.mutate(
      {
        id: nodo.id,
        nombre: nombreEdit.trim(),
        padreId: nodo.padreId,
        activo: nodo.activo,
      },
      { onSuccess: () => setEditando(false) },
    )
  }

  function agregarHijo() {
    if (!nombreHijo.trim() || !tipoHijo) return
    crear.mutate(
      { tipo: tipoHijo, nombre: nombreHijo.trim(), padreId: nodo.id },
      {
        onSuccess: () => {
          setNombreHijo('')
          setAgregandoHijo(false)
        },
      },
    )
  }

  function alternarActivo(desactivarHijos: boolean) {
    actualizar.mutate({
      id: nodo.id,
      nombre: nodo.nombre,
      padreId: nodo.padreId,
      activo: !nodo.activo,
      desactivarHijos,
    })
  }

  function handleDesactivar() {
    if (nodo.activo && tieneHijosActivos) {
      const confirmar = window.confirm(
        `"${nodo.nombre}" tiene hijos activos. ¿Desactivarlos también?`,
      )
      if (!confirmar) return
      alternarActivo(true)
      return
    }
    alternarActivo(false)
  }

  return (
    <div
      style={{ marginLeft: nivel * 20 }}
      className="border-l border-border pl-3 py-1.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
          {ETIQUETA_TIPO[nodo.tipo]}
        </span>

        {editando ? (
          <>
            <input
              value={nombreEdit}
              onChange={(e) => setNombreEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardarNombre()
                if (e.key === 'Escape') {
                  setNombreEdit(nodo.nombre)
                  setEditando(false)
                }
              }}
              autoFocus
              className="rounded-control border border-border px-2 py-0.5 text-sm focus:border-b-2 focus:border-b-brand-600 focus:outline-none"
            />
            <Button size="sm" variant="primary" onClick={guardarNombre}>
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNombreEdit(nodo.nombre)
                setEditando(false)
              }}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <span
              className={
                nodo.activo
                  ? 'text-sm text-text-primary'
                  : 'text-sm text-text-secondary line-through'
              }
            >
              {nodo.nombre}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDesactivar}
              className={nodo.activo ? 'text-error hover:bg-red-50' : 'text-brand-700'}
            >
              {nodo.activo ? 'Desactivar' : 'Reactivar'}
            </Button>
            {tipoHijo && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAgregandoHijo((v) => !v)}
                className="text-brand-700"
              >
                + agregar {ETIQUETA_TIPO[tipoHijo].toLowerCase()}
              </Button>
            )}
          </>
        )}
      </div>

      {agregandoHijo && tipoHijo && (
        <div className="mt-1 flex items-center gap-2">
          <input
            value={nombreHijo}
            onChange={(e) => setNombreHijo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') agregarHijo()
              if (e.key === 'Escape') {
                setNombreHijo('')
                setAgregandoHijo(false)
              }
            }}
            placeholder={`Nombre del/de la ${ETIQUETA_TIPO[tipoHijo].toLowerCase()}`}
            autoFocus
            className="rounded-control border border-border px-2 py-0.5 text-sm focus:border-b-2 focus:border-b-brand-600 focus:outline-none"
          />
          <Button size="sm" variant="primary" onClick={agregarHijo}>
            Crear
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setNombreHijo('')
              setAgregandoHijo(false)
            }}
          >
            Cancelar
          </Button>
        </div>
      )}

      {nodo.hijos.map((hijo) => (
        <NodoUbicacion key={hijo.id} nodo={hijo} nivel={nivel + 1} />
      ))}
    </div>
  )
}

interface UbicacionTreeEditorProps {
  arbol: UbicacionDto[]
}

/**
 * Árbol editable de ubicaciones para el panel admin. Recibe el árbol
 * plano-enraizado (zona → localidad → upz) desde el padre; los barrios
 * no entran aquí (se crean colgando de un UPZ/localidad, pero no se
 * renderizan porque son miles y esta vista es estructural).
 */
export function UbicacionTreeEditor({ arbol }: UbicacionTreeEditorProps) {
  if (arbol.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-border bg-white p-6 text-center text-sm text-text-secondary">
        Aún no hay zonas. Crea la primera usando el formulario de arriba.
      </p>
    )
  }
  return (
    <div className="space-y-0.5">
      {arbol.map((zona) => (
        <NodoUbicacion key={zona.id} nodo={zona} nivel={0} />
      ))}
    </div>
  )
}
