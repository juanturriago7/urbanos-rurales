/**
 * Página de inicio pública.
 * Placeholder — la lógica de negocio (listings, hero, etc.) se implementa por task.
 */
export function HomePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Encuentra tu propiedad ideal
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
          Miles de propiedades disponibles para compra y arriendo en toda Colombia.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/properties"
            className="rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700"
          >
            Ver propiedades
          </a>
          <a
            href="/search"
            className="rounded-lg border border-brand-300 px-6 py-3 text-base font-medium text-brand-700 hover:bg-brand-50"
          >
            Búsqueda avanzada
          </a>
        </div>
      </div>
    </section>
  )
}
