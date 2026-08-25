import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useCambiarEstado,
  useEliminarInmueble,
  useInmuebles,
  useMarcarDestacado,
} from '@/features/admin/properties/hooks/useInmuebles'
import { mensajeDeError } from '@/features/admin/auth/hooks/useLogin'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import type {
  EstadoInmueble,
  InmuebleAdminListItemDto,
} from '@/features/admin/properties/api/inmueblesApi'

/**
 * Listado de inmuebles del panel (RF-071) con filtro por estado y búsqueda,
 * más las acciones de estado editorial (RF-075) y destacado (RF-078).
 */

const ESTADOS: { valor: EstadoInmueble | ''; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'borrador', etiqueta: 'Borrador' },
  { valor: 'publicado', etiqueta: 'Publicado' },
  { valor: 'pausado', etiqueta: 'Pausado' },
  { valor: 'archivado', etiqueta: 'Archivado' },
]

const claseEstado: Record<EstadoInmueble, string> = {
  borrador: 'bg-surface-muted text-text-secondary',
  publicado: 'bg-green-100 text-green-800',
  pausado: 'bg-amber-100 text-amber-800',
  archivado: 'bg-red-100 text-red-800',
}

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function InmueblesPage() {
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState<EstadoInmueble | ''>('')
  // El input refleja lo que escribe el usuario; debouncedQ dispara la petición
  const [inputBusqueda, setInputBusqueda] = useState('')
  const debouncedQ = useDebounce(inputBusqueda.trim(), 400)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  // Cuando el debounced cambia reseteamos a pág. 1 para no quedarnos en una
  // página que ya no existe con el nuevo filtro.
  const filtro = {
    page,
    ...(estado ? { estado } : {}),
    ...(debouncedQ ? { q: debouncedQ } : {}),
  }

  const { data, isLoading, isError, error, isFetching } = useInmuebles(filtro)
  const cambiarEstado = useCambiarEstado()
  const destacar = useMarcarDestacado()
  const eliminar = useEliminarInmueble()

  const enAccion = cambiarEstado.isPending || destacar.isPending || eliminar.isPending

  const ejecutar = async (accion: () => Promise<unknown>, respaldo: string) => {
    setErrorAccion(null)
    try {
      await accion()
    } catch (e) {
      setErrorAccion(mensajeDeError(e, respaldo))
    }
  }

  const aplicarBusqueda = () => {
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Inmuebles</h2>
        <Link to="/admin/properties/nuevo">
          <Button>Nuevo inmueble</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as EstadoInmueble | '')
            setPage(1)
          }}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {ESTADOS.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.etiqueta}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            value={inputBusqueda}
            onChange={(e) => setInputBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aplicarBusqueda()}
            placeholder="Código, título o barrio"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <Button variant="secondary" onClick={aplicarBusqueda}>
            Buscar
          </Button>
        </div>

        {isFetching && <Spinner size="sm" />}
      </div>

      {isLoading && (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-error">
          Error al cargar inmuebles: {mensajeDeError(error, 'Error desconocido')}
        </div>
      )}

      {errorAccion && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-error">
          {errorAccion}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="mt-6 rounded-[--radius-card] border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm text-text-secondary">
            {debouncedQ || estado
              ? 'Ningún inmueble coincide con el filtro.'
              : 'Todavía no hay inmuebles registrados.'}
          </p>
          <Link to="/admin/properties/nuevo" className="mt-4 inline-block">
            <Button>Crear el primero</Button>
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="mt-4 overflow-x-auto rounded-[--radius-card] border border-border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  {['Foto', 'Código', 'Título', 'Tipo', 'Ubicación', 'Precio', 'Estado', 'Acciones'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((inmueble) => (
                  <Fila
                    key={inmueble.id}
                    inmueble={inmueble}
                    deshabilitado={enAccion}
                    onCambiarEstado={(nuevoEstado) =>
                      ejecutar(
                        () =>
                          cambiarEstado.mutateAsync({ id: inmueble.id, estado: nuevoEstado }),
                        'No se pudo cambiar el estado.',
                      )
                    }
                    onDestacar={() =>
                      ejecutar(
                        () =>
                          destacar.mutateAsync({
                            id: inmueble.id,
                            destacado: !inmueble.destacado,
                          }),
                        'No se pudo cambiar el destacado.',
                      )
                    }
                    onEliminar={() =>
                      ejecutar(
                        () => eliminar.mutateAsync(inmueble.id),
                        'No se pudo eliminar el inmueble.',
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
            <span>
              Página {data.page} de {data.totalPages} ({data.totalCount} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={!data.hasPreviousPage}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasNextPage}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface FilaProps {
  inmueble: InmuebleAdminListItemDto
  deshabilitado: boolean
  onCambiarEstado: (estado: EstadoInmueble) => void
  onDestacar: () => void
  onEliminar: () => void
}

function Fila({ inmueble, deshabilitado, onCambiarEstado, onDestacar, onEliminar }: FilaProps) {
  const precio =
    inmueble.precioVenta ?? inmueble.precioArriendo ?? null
  const etiquetaPrecio = inmueble.precioVenta ? 'Venta' : inmueble.precioArriendo ? 'Arriendo' : ''

  return (
    <tr className="transition-colors hover:bg-surface-muted">
      <td className="px-4 py-3">
        {inmueble.imagenPortada ? (
          <img
            src={inmueble.imagenPortada}
            alt={`Portada de ${inmueble.titulo}`}
            loading="lazy"
            className="h-12 w-16 rounded object-cover"
          />
        ) : (
          // Sin galería todavía: el hueco explica por qué no se puede publicar.
          <div
            title="Sin imágenes — se requiere al menos una para publicar (RF-077)"
            className="flex h-12 w-16 items-center justify-center rounded border border-dashed border-border text-xs text-text-secondary"
          >
            Sin foto
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
        {inmueble.codigoReferencia}
      </td>
      <td className="px-4 py-3 font-medium text-text-primary">
        {inmueble.titulo}
        {inmueble.destacado && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
            Destacado
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-text-secondary">{inmueble.tipoInmueble}</td>
      <td className="px-4 py-3 text-text-secondary">{inmueble.ubicacion}</td>
      <td className="px-4 py-3 text-text-secondary">
        {precio !== null ? (
          <>
            {formatoPesos.format(precio)}
            <span className="ml-1 text-xs text-text-secondary">{etiquetaPrecio}</span>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${claseEstado[inmueble.estado]}`}
        >
          {inmueble.estado}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          <Link to={`/admin/properties/${inmueble.id}/editar`}>
            <Button size="sm" variant="ghost">
              Editar
            </Button>
          </Link>
          {inmueble.estado !== 'publicado' && (
            <Button
              size="sm"
              variant="secondary"
              disabled={deshabilitado}
              onClick={() => onCambiarEstado('publicado')}
            >
              Publicar
            </Button>
          )}
          {inmueble.estado === 'publicado' && (
            <Button
              size="sm"
              variant="secondary"
              disabled={deshabilitado}
              onClick={() => onCambiarEstado('pausado')}
            >
              Pausar
            </Button>
          )}
          <Button size="sm" variant="ghost" disabled={deshabilitado} onClick={onDestacar}>
            {inmueble.destacado ? 'Quitar destacado' : 'Destacar'}
          </Button>
          <Button size="sm" variant="ghost" disabled={deshabilitado} onClick={onEliminar}>
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  )
}
