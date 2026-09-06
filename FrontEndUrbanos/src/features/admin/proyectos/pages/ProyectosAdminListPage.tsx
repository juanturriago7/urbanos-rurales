import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useArticulosAdmin,
  useCambiarEstadoArticulo,
  useEliminarArticulo,
} from '@/features/admin/proyectos/hooks/useProyectosAdmin'
import type { EstadoArticulo } from '@/features/admin/proyectos/api/proyectosAdminApi'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'

/**
 * Lista de proyectos del panel admin — spec 06.
 */
export function ProyectosAdminListPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error } = useArticulosAdmin(page)
  const cambiarEstado = useCambiarEstadoArticulo()
  const eliminar = useEliminarArticulo()

  function handleEliminar(id: number, titulo: string) {
    if (!window.confirm(`¿Eliminar el artículo "${titulo}"? Esta acción es irreversible.`)) return
    eliminar.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Proyectos</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Artículos de proyectos. Crea en borrador, edita y publica cuando estén listos.
          </p>
        </div>
        <Link to="/admin/proyectos/nuevo">
          <Button>+ nuevo artículo</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12"><Spinner size="md" /></div>
      )}
      {isError && (
        <div className="rounded-control border border-red-200 bg-red-50 p-4 text-sm text-error">
          Error: {error instanceof Error ? error.message : 'desconocido'}
        </div>
      )}

      {data && data.items.length === 0 && (
        <p className="rounded-control border border-dashed border-border bg-white p-8 text-center text-sm text-text-secondary">
          Aún no hay artículos. Crea el primero con "+ nuevo artículo".
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-[--radius-card] border border-border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Título</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Actualizado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((a) => (
                <tr key={a.id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-text-primary">{a.titulo}</p>
                    <p className="text-xs text-text-secondary">/{a.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={badgeClasses(a.estado)}>{a.estado}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-text-secondary">
                    {new Date(a.actualizadoEn).toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <Link to={`/admin/proyectos/${a.id}/editar`}>
                        <Button size="sm" variant="ghost">Editar</Button>
                      </Link>
                      {a.estado !== 'publicado' && (
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={cambiarEstado.isPending}
                          onClick={() => cambiarEstado.mutate({ id: a.id, estado: 'publicado' as EstadoArticulo })}
                        >
                          Publicar
                        </Button>
                      )}
                      {a.estado === 'publicado' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          isLoading={cambiarEstado.isPending}
                          onClick={() => cambiarEstado.mutate({ id: a.id, estado: 'borrador' as EstadoArticulo })}
                        >
                          Despublicar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-error hover:bg-red-50"
                        onClick={() => handleEliminar(a.id, a.titulo)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 border-t border-border px-6 py-4">
              <Button size="sm" variant="secondary" disabled={!data.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <span className="text-sm text-text-secondary">
                Página {data.page} de {data.totalPages}
              </span>
              <Button size="sm" variant="secondary" disabled={!data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}>
                Siguiente →
              </Button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}

function badgeClasses(estado: EstadoArticulo): string {
  const base = 'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider'
  return estado === 'publicado'
    ? `${base} bg-green-100 text-green-800`
    : estado === 'archivado'
    ? `${base} bg-gray-200 text-gray-700`
    : `${base} bg-yellow-100 text-yellow-800`
}
