import { useAuthStore } from '@/shared/hooks/useAuthStore'

/**
 * Página de dashboard. Placeholder — los widgets y métricas se implementan por task.
 */
export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary">
        Bienvenido, {user?.fullName}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">Rol: {user?.role}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 'Visitas' fuera por ahora: el conteo de visitas se retiró del alcance
            (el agendamiento vive en el calendario de Microsoft 365, sin tabla). */}
        {['Propiedades', 'Leads', 'Usuarios'].map((label) => (
          <div
            key={label}
            className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
