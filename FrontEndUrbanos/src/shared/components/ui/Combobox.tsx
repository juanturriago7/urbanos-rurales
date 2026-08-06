import { useRef, useState } from 'react'
import { Envoltura } from '@/shared/components/ui/Field'
import { Spinner } from '@/shared/components/ui/Spinner'

/**
 * Select buscable y asíncrono: el padre decide qué opciones mostrar (típicamente
 * un listado inicial corto mientras no hay texto, y resultados de una búsqueda
 * debounced una vez que el usuario escribe). No asume de dónde vienen los datos.
 */
export interface ComboboxOpcion {
  id: number
  etiqueta: string
  descripcion?: string
}

interface ComboboxProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  placeholder?: string
  wrapperClassName?: string
  seleccion: ComboboxOpcion | null
  opciones: ComboboxOpcion[]
  cargando?: boolean
  query: string
  onQueryChange: (query: string) => void
  onSeleccionar: (opcion: ComboboxOpcion | null) => void
}

const claseControl = [
  'mt-1 w-full rounded-control border border-border px-3 py-2 text-sm',
  'transition-colors focus:border-b-2 focus:border-b-brand-600',
  'disabled:bg-surface-muted disabled:text-text-secondary',
].join(' ')

export function Combobox({
  label,
  required,
  error,
  hint,
  placeholder,
  wrapperClassName,
  seleccion,
  opciones,
  cargando,
  query,
  onQueryChange,
  onSeleccionar,
}: ComboboxProps) {
  const [abierto, setAbierto] = useState(false)
  const [indiceActivo, setIndiceActivo] = useState(-1)
  // Deja tiempo a que el click en una opción llegue antes de cerrar el dropdown por blur.
  const cerrarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cerrarConRetraso = () => {
    cerrarTimeoutRef.current = setTimeout(() => setAbierto(false), 150)
  }

  const cancelarCierre = () => {
    if (cerrarTimeoutRef.current) clearTimeout(cerrarTimeoutRef.current)
  }

  const elegir = (opcion: ComboboxOpcion) => {
    cancelarCierre()
    onSeleccionar(opcion)
    onQueryChange('')
    setAbierto(false)
    setIndiceActivo(-1)
  }

  const manejarTeclado = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!abierto && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setAbierto(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndiceActivo((i) => Math.min(i + 1, opciones.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndiceActivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (indiceActivo >= 0 && opciones[indiceActivo]) {
        elegir(opciones[indiceActivo])
      }
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  const mostrarLimpiar = seleccion !== null && query === ''

  return (
    <Envoltura label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <div className="relative">
        <input
          type="text"
          className={claseControl}
          placeholder={mostrarLimpiar ? undefined : (placeholder ?? 'Escribe para buscar…')}
          value={mostrarLimpiar ? seleccion.etiqueta : query}
          onChange={(e) => {
            if (seleccion) onSeleccionar(null)
            onQueryChange(e.target.value)
            setIndiceActivo(-1)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={cerrarConRetraso}
          onKeyDown={manejarTeclado}
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
        />
        {cargando && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <Spinner size="sm" />
          </div>
        )}

        {abierto && (opciones.length > 0 || cargando) && (
          <ul
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-control border border-border bg-white text-sm shadow-lg"
            onMouseDown={cancelarCierre}
          >
            {opciones.length === 0 && cargando && (
              <li className="px-3 py-2 text-text-secondary">Buscando…</li>
            )}
            {opciones.map((opcion, indice) => (
              <li key={opcion.id}>
                <button
                  type="button"
                  className={`block w-full px-3 py-2 text-left hover:bg-surface-muted ${
                    indice === indiceActivo ? 'bg-surface-muted' : ''
                  }`}
                  onClick={() => elegir(opcion)}
                >
                  <span className="block text-text-primary">{opcion.etiqueta}</span>
                  {opcion.descripcion && (
                    <span className="block text-xs text-text-secondary">{opcion.descripcion}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {abierto && opciones.length === 0 && !cargando && query.trim().length >= 2 && (
          <div className="absolute z-10 mt-1 w-full rounded-control border border-border bg-white px-3 py-2 text-sm text-text-secondary shadow-lg">
            Sin resultados para «{query}».
          </div>
        )}
      </div>
    </Envoltura>
  )
}
