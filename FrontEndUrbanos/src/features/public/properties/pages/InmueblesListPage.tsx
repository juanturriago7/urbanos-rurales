import { BedDouble, ChevronDown, House, MapPin, Ruler, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePublicaciones } from '@/features/public/properties/hooks/usePublicaciones'
import { useBuscarUbicaciones, useCaracteristicas } from '@/features/admin/catalogos/hooks/useCatalogos'
import type { UbicacionBusquedaDto } from '@/features/admin/catalogos/api/catalogosApi'
import type {
  FiltroInmueblesPublico,
  InmueblePublicoListItemDto,
} from '@/features/public/properties/api/inmueblesPublicApi'
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon'
import { site } from '@/shared/config/site'

/* ── Helpers ─────────────────────────────────────────────────── */
const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
})

function formatPrice(inmueble: InmueblePublicoListItemDto): string {
  const isArriendo = inmueble.precioVenta === null && inmueble.precioArriendo !== null
  const precio = inmueble.precioVenta ?? inmueble.precioArriendo
  if (!precio) return '—'
  const pesos = formatoPesos.format(precio)
  return isArriendo ? `${pesos}/mes` : pesos
}

function operacionValida(v: string | null): 'venta' | 'arriendo' | undefined {
  return v === 'venta' || v === 'arriendo' ? v : undefined
}
function numeroOVacio(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
/**
 * Parsea `?caracteristicas=9,10,13` a `number[]`. Ignora valores no numéricos
 * silenciosamente — un valor corrupto en la URL no debe romper el filtro entero.
 */
function idsCaracteristicas(v: string | null): number[] | undefined {
  if (!v) return undefined
  const ids = v
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
  return ids.length > 0 ? ids : undefined
}

/* ── Tarjeta de inmueble ─────────────────────────────────────── */
function TarjetaInmueble({ inmueble }: { inmueble: InmueblePublicoListItemDto }) {
  const esArriendo = inmueble.precioVenta === null && inmueble.precioArriendo !== null
  const operacion = esArriendo ? 'Arriendo' : 'Venta'
  const badgeBg   = esArriendo ? 'bg-[#df500c]' : 'bg-[#00b5c5]'
  const badgeTxt  = esArriendo ? 'text-white' : 'text-[#001124]'

  return (
    <article className="group relative bg-white border border-[#d8dfe4] rounded-[18px] overflow-hidden p-px flex flex-col hover:shadow-[0_8px_32px_rgba(0,17,36,0.10)] hover:-translate-y-0.5 transition-all duration-300">
      {/* El Link envuelve imagen + info; el botón favorito queda fuera para no anidar
          <button> dentro de <a>, que es HTML inválido. `contents` lo saca del flujo
          para que la grilla flex de arriba (imagen/info) no se rompa. */}
      <Link to={`/inmuebles/${inmueble.slug}`} className="contents">
        {/* Imagen */}
        <div className="relative shrink-0 overflow-hidden rounded-t-[17px]" style={{ aspectRatio: '382/286.5' }}>
          {inmueble.imagenPortada ? (
            <img src={inmueble.imagenPortada} alt={inmueble.titulo} loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)' }}>
              <span className="text-[rgba(255,255,255,0.4)] text-[11px] text-center px-4">Sin fotografía disponible</span>
            </div>
          )}
          {/* Badge operación */}
          <span className={`absolute top-3.5 left-3.5 ${badgeBg} ${badgeTxt} text-[11px] font-bold tracking-[0.33px] px-3 py-1.5 rounded-full`}>
            {operacion}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 p-5">
          {/* Precio */}
          <p className="font-extrabold text-[#004b98] text-[20px] tracking-[-0.5px] leading-none">
            {formatPrice(inmueble)}
          </p>
          {/* Título */}
          <p className="font-bold text-[#001124] text-[15px] leading-snug mt-0.5 line-clamp-2">
            {inmueble.titulo}
          </p>
          {/* Ubicación */}
          <div className="flex items-center gap-[5px] pb-2.5 text-[#7a8187]">
            <MapPin className="w-[13px] h-[13px] shrink-0" aria-hidden="true" />
            <span className="text-[#7a8187] text-[13px] truncate">{inmueble.ubicacion}</span>
          </div>
          {/* Separador + specs */}
          <div className="border-t border-[#e0e5e9] pt-[15px] flex flex-wrap gap-x-[14px] gap-y-1 items-center">
            {inmueble.areaConstruidaM2 && (
              <span className="flex items-center gap-[5px] text-[#7a8187]">
                <Ruler className="w-[13px] h-[13px]" aria-hidden="true" />
                <span className="text-[#7a8187] text-[12px] font-medium">{inmueble.areaConstruidaM2} m²</span>
              </span>
            )}
            {inmueble.habitaciones > 0 && (
              <span className="flex items-center gap-[5px] text-[#7a8187]">
                <BedDouble className="w-[13px] h-[13px]" aria-hidden="true" />
                <span className="text-[#7a8187] text-[12px] font-medium">{inmueble.habitaciones} hab</span>
              </span>
            )}
            <span className="flex items-center gap-[5px] text-[#7a8187]">
              <House className="w-[13px] h-[13px]" aria-hidden="true" />
              <span className="text-[#7a8187] text-[12px] font-medium capitalize">{inmueble.tipoInmueble}</span>
            </span>
            {inmueble.estrato && (
              <span className="text-[#7a8187] text-[12px] font-medium">Estrato {inmueble.estrato}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}

/* ── Select de filtro ────────────────────────────────────────── */
function FiltroSelect({
  id, label, value, options, onChange,
}: {
  id: string; label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-[6px] flex-1 min-w-0">
      <label htmlFor={id}
        className="text-[#7a8187] text-[11px] font-semibold tracking-[0.66px] uppercase">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] pl-[19px] pr-8 py-[13px] text-[#0d1c27] text-[14px] outline-none focus:border-[#004b98] focus:bg-white transition-colors appearance-none cursor-pointer">
        {options.map((o) => (
          <option key={o.value || '__all'} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/* ── Autocomplete de ubicación ───────────────────────────────── */
/**
 * El backend filtra por `ubicacion_id` (long), no por texto — este control
 * busca contra el catálogo (mismo endpoint que usa el autocomplete del panel
 * admin) y solo fija el filtro cuando el usuario elige una sugerencia real,
 * nunca con el texto libre que esté escribiendo.
 */
function FiltroUbicacion({
  ubicacionId,
  nombreInicial,
  onSeleccionar,
  onLimpiar,
}: {
  ubicacionId: number | undefined
  nombreInicial: string
  onSeleccionar: (u: UbicacionBusquedaDto) => void
  onLimpiar: () => void
}) {
  const [termino, setTermino] = useState(nombreInicial)
  const [abierto, setAbierto] = useState(false)
  const { data: sugerencias } = useBuscarUbicaciones(termino)

  return (
    <div className="relative flex flex-col gap-[6px] flex-1 min-w-0">
      <label htmlFor="f-ubicacion"
        className="text-[#7a8187] text-[11px] font-semibold tracking-[0.66px] uppercase">
        Ubicación
      </label>
      <input
        id="f-ubicacion"
        type="text"
        value={termino}
        placeholder="Zona, localidad, UPZ o barrio..."
        onChange={(e) => {
          setTermino(e.target.value)
          setAbierto(true)
          if (!e.target.value.trim() && ubicacionId) onLimpiar()
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] pl-[19px] pr-4 py-[13px] text-[#0d1c27] text-[14px] outline-none focus:border-[#004b98] focus:bg-white transition-colors placeholder:text-[#7a8187]"
      />
      {abierto && termino.trim().length >= 2 && sugerencias && sugerencias.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 z-20 max-h-64 overflow-y-auto rounded-[10px] border border-[#d8dfe4] bg-white shadow-lg">
          {sugerencias.map((s) => (
            <li key={`${s.tipo}-${s.id}`}>
              {/* onMouseDown, no onClick: dispara antes que el blur del input,
                  que si no cerraría la lista antes de registrar la selección. */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setTermino(s.nombre)
                  setAbierto(false)
                  onSeleccionar(s)
                }}
                className="block w-full text-left px-4 py-2.5 text-[14px] text-[#0d1c27] hover:bg-[#eff4f8] transition-colors"
              >
                {s.nombre}
                <span className="block text-[12px] text-[#7a8187]">{s.rutaCompleta}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Skeleton ────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-white border border-[#d8dfe4] rounded-[18px] overflow-hidden animate-pulse">
      <div className="bg-[#e0e5e9]" style={{ aspectRatio: '382/286.5' }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-5 bg-[#e0e5e9] rounded w-1/3" />
        <div className="h-4 bg-[#e0e5e9] rounded w-2/3" />
        <div className="h-3 bg-[#e0e5e9] rounded w-1/2" />
        <div className="h-px bg-[#e0e5e9]" />
        <div className="h-3 bg-[#e0e5e9] rounded w-3/4" />
      </div>
    </div>
  )
}

/* ── Opciones de filtros ─────────────────────────────────────── */
const OPT_TIPO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'local', label: 'Local Comercial' },
  { value: 'finca', label: 'Finca' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'lote', label: 'Lote' },
  { value: 'bodega', label: 'Bodega' },
]

const OPT_AREA = [
  { value: '', label: 'Cualquier área' },
  { value: '40', label: 'Desde 40 m²' },
  { value: '60', label: 'Desde 60 m²' },
  { value: '80', label: 'Desde 80 m²' },
  { value: '120', label: 'Desde 120 m²' },
  { value: '200', label: 'Desde 200 m²' },
  { value: '500', label: 'Desde 500 m²' },
]

const OPT_ESTRATO = [
  { value: '', label: 'Todos los estratos' },
  { value: '1', label: 'Estrato 1' },
  { value: '2', label: 'Estrato 2' },
  { value: '3', label: 'Estrato 3' },
  { value: '4', label: 'Estrato 4' },
  { value: '5', label: 'Estrato 5' },
  { value: '6', label: 'Estrato 6' },
]

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export function InmueblesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [busqueda, setBusqueda] = useState(searchParams.get('q') ?? '')
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  const filtros = useMemo<FiltroInmueblesPublico>(() => ({
    operacion: operacionValida(searchParams.get('operacion')),
    tipo:      searchParams.get('tipo') ?? undefined,
    ubicacionId: numeroOVacio(searchParams.get('ubicacion_id')),
    areaMin:   numeroOVacio(searchParams.get('area_min')),
    estrato:   numeroOVacio(searchParams.get('estrato')),
    q:         searchParams.get('q') ?? undefined,
    caracteristicaIds: idsCaracteristicas(searchParams.get('caracteristicas')),
    page:      numeroOVacio(searchParams.get('page')) ?? 1,
    pageSize:  12,
  }), [searchParams])

  const { data, isLoading, isError } = usePublicaciones(filtros)
  const { data: categoriasCaracteristicas } = useCaracteristicas()

  const setFiltro = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  /**
   * Toggle de un id de característica en el filtro `caracteristicas=1,2,3`.
   * Vacío = sin filtro.
   */
  const toggleCaracteristica = (id: number) => {
    const actuales = idsCaracteristicas(searchParams.get('caracteristicas')) ?? []
    const siguientes = actuales.includes(id)
      ? actuales.filter((x) => x !== id)
      : [...actuales, id].sort((a, b) => a - b)
    setFiltro('caracteristicas', siguientes.join(','))
  }

  const limpiar = () => setSearchParams(new URLSearchParams())

  const cambiarPagina = (p: number) => {
    const next = new URLSearchParams(searchParams)
    if (p === 1) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const seleccionarUbicacion = (u: UbicacionBusquedaDto) => {
    const next = new URLSearchParams(searchParams)
    next.set('ubicacion_id', String(u.id))
    next.set('ubicacion_nombre', u.nombre)
    next.delete('page')
    setSearchParams(next)
  }

  const limpiarUbicacion = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('ubicacion_id')
    next.delete('ubicacion_nombre')
    next.delete('page')
    setSearchParams(next)
  }

  const hayFiltros = useMemo(() =>
    !!(searchParams.get('operacion') || searchParams.get('tipo') ||
       searchParams.get('area_min') || searchParams.get('estrato') ||
       searchParams.get('ubicacion_id') || searchParams.get('q') ||
       searchParams.get('caracteristicas')),
    [searchParams])

  const filtrosActivosCount = useMemo(() => [
    searchParams.get('operacion'),
    searchParams.get('tipo'),
    searchParams.get('area_min'),
    searchParams.get('estrato'),
    searchParams.get('ubicacion_id'),
    searchParams.get('caracteristicas'),
  ].filter(Boolean).length, [searchParams])

  const caracteristicasSeleccionadas = useMemo(
    () => new Set(idsCaracteristicas(searchParams.get('caracteristicas')) ?? []),
    [searchParams],
  )

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    setFiltro('q', busqueda.trim())
  }

  const totalStr = data
    ? `${data.totalCount} inmueble${data.totalCount !== 1 ? 's' : ''} encontrado${data.totalCount !== 1 ? 's' : ''}`
    : ''

  return (
    <div className="bg-[#eff4f8] min-h-screen font-['Outfit',sans-serif]">

      {/* ══ HERO HEADER ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-[#001124] pt-[150px] pb-16 px-12"
        style={{ backgroundImage: 'linear-gradient(180deg, rgba(0,181,197,0.06) 1.67%, transparent 1.67%), linear-gradient(90deg, rgba(0,181,197,0.06) 1.67%, transparent 1.67%)' }}>
        <div className="max-w-[1200px] mx-auto flex flex-col gap-3">
          <h1 className="font-extrabold text-white text-[48px] tracking-[-1px] leading-none">
            Portafolio de Inmuebles
          </h1>
          <p className="text-[#8bb6c4] text-[16px] font-normal max-w-[600px] leading-[1.65]">
            Explore nuestra selección actual de propiedades urbanas y rurales disponibles en
            venta y arriendo a nivel nacional.
          </p>
        </div>
      </section>

      {/* ══ CONTENT ══════════════════════════════════════════════ */}
      <section className="px-12 pb-16">
        <div className="max-w-[1200px] mx-auto">

          {/* Barra de búsqueda */}
          <form onSubmit={handleBuscar}
            className="bg-white rounded-2xl shadow-[0px_16px_24px_rgba(0,17,36,0.18)] flex items-center gap-2 p-2 -mt-[31px] relative z-10 mb-6">
            <div className="flex items-center pl-2 shrink-0 text-[#0d1c27] opacity-40">
              <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            </div>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, zona o ciudad..."
              className="flex-1 min-w-0 px-4 py-[14px] text-[15px] text-[#0d1c27] placeholder:text-[#757575] bg-transparent outline-none"
            />
            <button type="submit"
              className="flex items-center gap-2 bg-[#004b98] text-white font-bold text-[14px] px-[26px] py-[14px] rounded-[10px] hover:bg-[#003b7a] transition-colors shrink-0">
              <Search className="w-[15px] h-[15px]" aria-hidden="true" />
              Buscar
            </button>
          </form>

          {/* Filtros — disclosure colapsable: prioriza mostrar el listado de
              inmuebles al entrar, en vez de tapar la pantalla con controles. */}
          <div className="bg-white border border-[#d8dfe4] rounded-[20px] mb-5 overflow-hidden">
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              aria-expanded={filtrosAbiertos}
              aria-controls="panel-filtros-inmuebles"
              className="w-full flex items-center justify-between gap-3 px-8 py-5 text-left"
            >
              <span className="flex items-center gap-2 text-[#001124] text-[15px] font-bold">
                <SlidersHorizontal className="w-[16px] h-[16px] text-[#004b98]" aria-hidden="true" />
                Filtros
                {filtrosActivosCount > 0 && (
                  <span className="bg-[#004b98] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {filtrosActivosCount}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`w-[18px] h-[18px] text-[#7a8187] transition-transform duration-200 ${filtrosAbiertos ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            <div
              id="panel-filtros-inmuebles"
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: filtrosAbiertos ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="border-t border-[#e0e5e9] flex flex-wrap gap-4 items-end px-8 py-7">
                  <FiltroSelect id="f-tipo" label="Tipo de inmueble"
                    value={searchParams.get('tipo') ?? ''}
                    options={OPT_TIPO}
                    onChange={(v) => setFiltro('tipo', v)} />

                  <FiltroUbicacion
                    ubicacionId={numeroOVacio(searchParams.get('ubicacion_id'))}
                    nombreInicial={searchParams.get('ubicacion_nombre') ?? ''}
                    onSeleccionar={seleccionarUbicacion}
                    onLimpiar={limpiarUbicacion}
                  />

                  <FiltroSelect id="f-area" label="Área"
                    value={searchParams.get('area_min') ?? ''}
                    options={OPT_AREA}
                    onChange={(v) => setFiltro('area_min', v)} />

                  <FiltroSelect id="f-estrato" label="Estrato"
                    value={searchParams.get('estrato') ?? ''}
                    options={OPT_ESTRATO}
                    onChange={(v) => setFiltro('estrato', v)} />

                  {hayFiltros && (
                    <button type="button" onClick={limpiar}
                      className="border border-[#c8cfd4] text-[#7a8187] text-[13px] font-semibold px-[21px] py-[13px] rounded-[10px] hover:border-[#004b98] hover:text-[#004b98] transition-colors shrink-0 self-end">
                      Limpiar filtros
                    </button>
                  )}
                </div>

                {/* Características (genérico por categoría) */}
                {categoriasCaracteristicas && categoriasCaracteristicas.length > 0 && (
                  <div className="border-t border-[#e0e5e9] px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#001124] text-[15px] font-bold">Características</h3>
                      {caracteristicasSeleccionadas.size > 0 && (
                        <button type="button"
                          onClick={() => setFiltro('caracteristicas', '')}
                          className="text-[#7a8187] text-[12px] font-semibold hover:text-[#004b98] transition-colors">
                          Limpiar ({caracteristicasSeleccionadas.size})
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                      {categoriasCaracteristicas.map((cat) => {
                        const visibles = cat.caracteristicas.filter((c) => c.filtrable)
                        if (visibles.length === 0) return null
                        return (
                          <div key={cat.id}>
                            <p className="text-[#7a8187] text-[11px] font-semibold tracking-[0.66px] uppercase mb-2">
                              {cat.nombre}
                            </p>
                            <ul className="space-y-1.5">
                              {visibles.map((c) => (
                                <li key={c.id}>
                                  <label className="flex items-center gap-2 cursor-pointer text-[#0d1c27] text-[14px] hover:text-[#004b98] transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={caracteristicasSeleccionadas.has(c.id)}
                                      onChange={() => toggleCaracteristica(c.id)}
                                      className="w-4 h-4 accent-[#004b98] cursor-pointer"
                                    />
                                    <span>{c.nombre}</span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contador */}
          {!isLoading && data && (
            <p className="text-[14px] font-bold text-[#001124] mb-5">
              <span>{data.totalCount}</span>
              <span className="font-normal text-[#7a8187]"> {totalStr.replace(String(data.totalCount), '')}</span>
            </p>
          )}

          {/* Grid de tarjetas */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          )}

          {isError && (
            <div className="bg-white border border-red-200 rounded-[16px] p-10 text-center">
              <p className="text-red-700 font-semibold">No pudimos cargar los inmuebles.</p>
              <p className="text-red-500 text-[14px] mt-1">Intenta nuevamente en unos minutos.</p>
            </div>
          )}

          {!isLoading && !isError && data?.items.length === 0 && (
            <div className="bg-white border border-[#d8dfe4] rounded-[20px] p-16 text-center">
              <p className="font-bold text-[#001124] text-[22px]">Sin resultados</p>
              <p className="text-[#7a8187] text-[15px] mt-2">Prueba quitando algún filtro para ver más propiedades.</p>
              <button type="button" onClick={limpiar}
                className="mt-6 bg-[#004b98] text-white font-semibold text-[14px] px-8 py-3 rounded-[10px] hover:bg-[#003b7a] transition-colors">
                Ver todas las propiedades
              </button>
            </div>
          )}

          {!isLoading && !isError && data && data.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items.map((inmueble) => (
                  <TarjetaInmueble key={inmueble.id} inmueble={inmueble} />
                ))}
              </div>

              {/* Paginación */}
              {data.totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginación">
                  <button type="button" disabled={!data.hasPreviousPage}
                    onClick={() => cambiarPagina((filtros.page ?? 1) - 1)}
                    className="px-5 py-2.5 rounded-[10px] border border-[#d8dfe4] bg-white text-[#001124] text-[13px] font-semibold hover:border-[#004b98] hover:text-[#004b98] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    ← Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(data.totalPages, 7) }).map((_, i) => {
                      const page = i + 1
                      const current = filtros.page ?? 1
                      const isActive = page === current
                      return (
                        <button key={page} type="button"
                          onClick={() => cambiarPagina(page)}
                          className={`w-9 h-9 rounded-[8px] text-[13px] font-semibold transition-colors ${
                            isActive
                              ? 'bg-[#004b98] text-white'
                              : 'bg-white border border-[#d8dfe4] text-[#7a8187] hover:border-[#004b98] hover:text-[#004b98]'
                          }`}>
                          {page}
                        </button>
                      )
                    })}
                    {data.totalPages > 7 && (
                      <span className="px-2 text-[#7a8187] text-[13px]">... {data.totalPages}</span>
                    )}
                  </div>

                  <button type="button" disabled={!data.hasNextPage}
                    onClick={() => cambiarPagina((filtros.page ?? 1) + 1)}
                    className="px-5 py-2.5 rounded-[10px] border border-[#d8dfe4] bg-white text-[#001124] text-[13px] font-semibold hover:border-[#004b98] hover:text-[#004b98] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    Siguiente →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${site.contacto.whatsapp}`}
        target="_blank" rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-7 right-7 z-50 w-[52px] h-[52px] bg-[#25d366] rounded-[26px] flex items-center justify-center text-white shadow-[0px_4px_10px_rgba(37,211,102,0.5)] hover:scale-110 transition-transform duration-200">
        <WhatsAppIcon className="w-[26px] h-[26px]" />
      </a>

    </div>
  )
}
