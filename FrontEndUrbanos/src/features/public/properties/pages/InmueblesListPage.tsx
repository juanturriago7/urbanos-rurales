import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePublicaciones } from '@/features/public/properties/hooks/usePublicaciones'
import type {
  FiltroInmueblesPublico,
  InmueblePublicoListItemDto,
} from '@/features/public/properties/api/inmueblesPublicApi'

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const TIPOS_INMUEBLE = [
  { value: '', label: 'Todos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'local', label: 'Local' },
  { value: 'finca', label: 'Finca' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'lote', label: 'Lote' },
]

const RANGOS_PRECIO = [
  { value: '', label: 'Sin mínimo' },
  { value: '100000000', label: 'Desde $100M' },
  { value: '300000000', label: 'Desde $300M' },
  { value: '500000000', label: 'Desde $500M' },
  { value: '1000000000', label: 'Desde $1.000M' },
  { value: '2000000000', label: 'Desde $2.000M' },
]

const RANGOS_AREA = [
  { value: '', label: 'Sin mínimo' },
  { value: '40', label: 'Desde 40 m²' },
  { value: '60', label: 'Desde 60 m²' },
  { value: '80', label: 'Desde 80 m²' },
  { value: '120', label: 'Desde 120 m²' },
  { value: '200', label: 'Desde 200 m²' },
]

const HABITACIONES = [
  { value: '', label: 'Cualquiera' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

const BANOS = [
  { value: '', label: 'Cualquiera' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
]

function numeroOVacio(valor: string | null): number | undefined {
  if (valor === null || valor === '') return undefined
  const n = Number(valor)
  return Number.isFinite(n) ? n : undefined
}

function operacionValida(valor: string | null): 'venta' | 'arriendo' | undefined {
  if (valor === 'venta' || valor === 'arriendo') return valor
  return undefined
}

function TarjetaInmueble({ inmueble }: { inmueble: InmueblePublicoListItemDto }) {
  const precio = inmueble.precioVenta ?? inmueble.precioArriendo
  const operacion = inmueble.precioVenta !== null ? 'Venta' : 'Arriendo'

  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-white transition-all duration-300 hover:border-[#8b6f4e]/40 hover:shadow-[0_8px_32px_rgba(28,25,23,0.07)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {inmueble.imagenPortada ? (
          <img
            src={inmueble.imagenPortada}
            alt={inmueble.titulo}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-secondary">Sin foto</div>
        )}
        <span className="absolute top-3 left-3 rounded-sm bg-[#1c1917] px-2 py-1 text-[9px] font-bold tracking-[1.5px] text-white uppercase">
          {operacion}
        </span>
      </div>
      <div className="p-5">
        <p className="font-serif text-[18px] leading-tight font-bold text-[#1c1917]">{inmueble.titulo}</p>
        <p className="mt-1 text-[12px] text-[#1c1917]/50">
          {inmueble.tipoInmueble} · {inmueble.ubicacion}
        </p>
        <p className="mt-3 text-[11px] text-[#1c1917]/40">
          {inmueble.habitaciones} hab · {inmueble.banos} baños
          {inmueble.parqueaderos > 0 && ` · ${inmueble.parqueaderos} parq.`}
          {inmueble.areaConstruidaM2 !== null && ` · ${inmueble.areaConstruidaM2} m²`}
        </p>
        {precio !== null && (
          <p className="mt-3 font-serif text-[18px] font-bold text-[#8b6f4e]">
            {formatoPesos.format(precio)}
            {operacion === 'Arriendo' && <span className="text-[11px] font-normal text-[#1c1917]/40"> /mes</span>}
          </p>
        )}
      </div>
    </article>
  )
}

function FiltroSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold tracking-[2px] text-[#1c1917]/60 uppercase">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-sm border border-border bg-white px-3 text-sm text-[#1c1917] outline-none transition-colors focus:border-[#8b6f4e]"
      >
        {options.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function InmueblesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filtros = useMemo<FiltroInmueblesPublico>(() => {
    const filtroOperacion = operacionValida(searchParams.get('operacion'))
    const filtroTipo = searchParams.get('tipo') ?? undefined
    const filtroPrecioMin = numeroOVacio(searchParams.get('precio_min'))
    const filtroPrecioMax = numeroOVacio(searchParams.get('precio_max'))
    const filtroAreaMin = numeroOVacio(searchParams.get('area_min'))
    const filtroHabitaciones = numeroOVacio(searchParams.get('habitaciones'))
    const filtroBanos = numeroOVacio(searchParams.get('banos'))
    const filtroPage = numeroOVacio(searchParams.get('page')) ?? 1
    return {
      operacion: filtroOperacion,
      tipo: filtroTipo,
      precioMin: filtroPrecioMin,
      precioMax: filtroPrecioMax,
      areaMin: filtroAreaMin,
      habitaciones: filtroHabitaciones,
      banos: filtroBanos,
      page: filtroPage,
      pageSize: 12,
    }
  }, [searchParams])

  const { data, isLoading, isError } = usePublicaciones(filtros)

  const precioMaxPreset = searchParams.get('precio_max') ?? ''

  const setFiltro = (clave: string, valor: string) => {
    const next = new URLSearchParams(searchParams)
    if (valor === '' || valor === null) {
      next.delete(clave)
    } else {
      next.set(clave, valor)
    }
    next.delete('page')
    setSearchParams(next)
  }

  const limpiarFiltros = () => {
    setSearchParams(new URLSearchParams())
  }

  const cambiarPagina = (nuevaPagina: number) => {
    const next = new URLSearchParams(searchParams)
    if (nuevaPagina === 1) next.delete('page')
    else next.set('page', String(nuevaPagina))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtrosVacios = useMemo(() => {
    return (
      !searchParams.get('operacion') &&
      !searchParams.get('tipo') &&
      !searchParams.get('precio_min') &&
      !searchParams.get('precio_max') &&
      !searchParams.get('area_min') &&
      !searchParams.get('habitaciones') &&
      !searchParams.get('banos')
    )
  }, [searchParams])

  const titulo = useMemo(() => {
    if (filtros.tipo) return `Inmuebles tipo ${filtros.tipo}`
    if (filtros.operacion === 'venta') return 'Inmuebles en venta'
    if (filtros.operacion === 'arriendo') return 'Inmuebles en arriendo'
    return 'Catálogo de inmuebles'
  }, [filtros.operacion, filtros.tipo])

  return (
    <section className="mx-auto w-full max-w-350 px-6 py-16 sm:px-10 lg:py-24">
      <header className="mb-10 border-b border-border pb-8">
        <span className="text-[9px] font-bold tracking-[4px] text-[#8b6f4e] uppercase">Urbanos &amp; Rurales</span>
        <h1 className="mt-3 font-serif text-[clamp(34px,5vw,58px)] leading-tight font-bold text-[#1c1917]">{titulo}</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#1c1917]/50">
          Encuentra propiedades disponibles para comprar o arrendar en Bogotá y todo Colombia. Usa los filtros
          para ajustar tu búsqueda.
        </p>
      </header>

      <div className="mb-10 rounded-sm border border-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-bold tracking-[2px] text-[#1c1917]/60 uppercase">Filtros</h2>
          {!filtrosVacios && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-[10px] font-bold tracking-[2px] text-[#8b6f4e] uppercase transition-colors hover:text-[#735840]"
            >
              Limpiar todo
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-[2px] text-[#1c1917]/60 uppercase">Operación</span>
            <div className="inline-flex h-10 overflow-hidden rounded-sm border border-border">
              <button
                type="button"
                onClick={() => setFiltro('operacion', '')}
                className={`flex-1 px-3 text-[11px] font-bold tracking-[1.5px] uppercase transition-colors ${
                  !filtros.operacion ? 'bg-[#1c1917] text-white' : 'bg-white text-[#1c1917]/60 hover:bg-surface-muted'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltro('operacion', 'venta')}
                className={`flex-1 border-l border-border px-3 text-[11px] font-bold tracking-[1.5px] uppercase transition-colors ${
                  filtros.operacion === 'venta' ? 'bg-[#1c1917] text-white' : 'bg-white text-[#1c1917]/60 hover:bg-surface-muted'
                }`}
              >
                Venta
              </button>
              <button
                type="button"
                onClick={() => setFiltro('operacion', 'arriendo')}
                className={`flex-1 border-l border-border px-3 text-[11px] font-bold tracking-[1.5px] uppercase transition-colors ${
                  filtros.operacion === 'arriendo' ? 'bg-[#1c1917] text-white' : 'bg-white text-[#1c1917]/60 hover:bg-surface-muted'
                }`}
              >
                Arriendo
              </button>
            </div>
          </div>

          <FiltroSelect
            id="filtro-tipo"
            label="Tipo de inmueble"
            value={filtros.tipo ?? ''}
            options={TIPOS_INMUEBLE}
            onChange={(value) => setFiltro('tipo', value)}
          />

          <FiltroSelect
            id="filtro-precio-min"
            label="Precio desde"
            value={searchParams.get('precio_min') ?? ''}
            options={RANGOS_PRECIO}
            onChange={(value) => setFiltro('precio_min', value)}
          />

          <FiltroSelect
            id="filtro-precio-max"
            label="Precio hasta"
            value={precioMaxPreset}
            options={[
              { value: '', label: 'Sin máximo' },
              { value: '300000000', label: 'Hasta $300M' },
              { value: '500000000', label: 'Hasta $500M' },
              { value: '1000000000', label: 'Hasta $1.000M' },
              { value: '2000000000', label: 'Hasta $2.000M' },
              { value: '5000000000', label: 'Hasta $5.000M' },
            ]}
            onChange={(value) => setFiltro('precio_max', value)}
          />

          <FiltroSelect
            id="filtro-area-min"
            label="Área mínima"
            value={searchParams.get('area_min') ?? ''}
            options={RANGOS_AREA}
            onChange={(value) => setFiltro('area_min', value)}
          />

          <FiltroSelect
            id="filtro-habitaciones"
            label="Habitaciones"
            value={searchParams.get('habitaciones') ?? ''}
            options={HABITACIONES}
            onChange={(value) => setFiltro('habitaciones', value)}
          />

          <FiltroSelect
            id="filtro-banos"
            label="Baños"
            value={searchParams.get('banos') ?? ''}
            options={BANOS}
            onChange={(value) => setFiltro('banos', value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-sm border border-border bg-surface-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
          No pudimos cargar los inmuebles. Intenta nuevamente en unos minutos.
        </div>
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <div className="rounded-sm border border-border bg-white p-12 text-center">
          <h2 className="font-serif text-2xl font-bold text-[#1c1917]">No hay inmuebles disponibles</h2>
          <p className="mt-2 text-sm text-[#1c1917]/50">Prueba quitando algún filtro para ver más resultados.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <div className="mb-6 text-xs tracking-[1px] text-[#1c1917]/40">{data.totalCount} resultados</div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((inmueble) => <TarjetaInmueble key={inmueble.id} inmueble={inmueble} />)}
          </div>
          {data.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginación">
              <button
                type="button"
                disabled={!data.hasPreviousPage}
                onClick={() => cambiarPagina((filtros.page ?? 1) - 1)}
                className="rounded-sm border border-border px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-30"
              >
                Anterior
              </button>
              <span className="px-3 text-xs text-[#1c1917]/50">Página {data.page} de {data.totalPages}</span>
              <button
                type="button"
                disabled={!data.hasNextPage}
                onClick={() => cambiarPagina((filtros.page ?? 1) + 1)}
                className="rounded-sm border border-border px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-30"
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
