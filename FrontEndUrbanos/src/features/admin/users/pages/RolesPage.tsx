import { useState } from 'react'
import { useRoles } from '@/features/admin/users/hooks/useRoles'
import { Spinner } from '@/shared/components/ui/Spinner'
import { Button } from '@/shared/components/ui/Button'

/**
 * Página de Roles — ejemplo end-to-end que consume GET /api/roles.
 * Sirve como plantilla para las demás páginas de listado del admin.
 *
 * Patrón: useRoles (TanStack Query) → rolesApi (Axios) → GET /api/roles (backend CQRS)
 */
export function RolesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error } = useRoles(page)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Roles del sistema</h2>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {/* Estado de error */}
      {isError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-error">
          Error al cargar roles:{' '}
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {/* Tabla de datos */}
      {data && (
        <>
          <div className="mt-4 overflow-hidden rounded-[--radius-card] border border-border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  {['Nombre', 'Descripción', 'Usuarios'].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((role) => (
                  <tr key={role.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{role.name}</td>
                    <td className="px-6 py-4 text-text-secondary">{role.description}</td>
                    <td className="px-6 py-4 text-text-secondary">{role.userCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
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
