import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePublicaciones } from '@/features/public/properties/hooks/usePublicaciones'
import type {
  FiltroInmueblesPublico,
  InmueblePublicoListItemDto,
} from '@/features/public/properties/api/inmueblesPublicApi'
import { site } from '@/shared/config/site'

/* ── Figma SVG icons ─────────────────────────────────────────── */
const imgSearch  = 'https://www.figma.com/api/mcp/asset/364f4e8f-57a5-42f7-92c0-57772918b733.svg'
const imgPin     = 'https://www.figma.com/api/mcp/asset/cb2a93d0-e797-4218-b0f9-55b5dc9ebc03.svg'
const imgArea    = 'https://www.figma.com/api/mcp/asset/21f20c79-2624-4998-a65e-b58e3e7b4952.svg'
const imgBed     = 'https://www.figma.com/api/mcp/asset/7787ec0a-f26c-4415-992b-28194a4ac0a2.svg'
const imgType    = 'https://www.figma.com/api/mcp/asset/3372854b-3079-4041-8ba2-6a435753576d.svg'
const imgHeart   = 'https://www.figma.com/api/mcp/asset/b9925bc4-cb82-4abf-8278-3128cd162c3b.svg'
const imgWA      = 'https://www.figma.com/api/mcp/asset/40923193-b42d-45fd-8f68-f13e7eaa257b.svg'

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

/* ── Tarjeta de inmueble ─────────────────────────────────────── */
function TarjetaInmueble({ inmueble }: { inmueble: InmueblePublicoListItemDto }) {
  const esArriendo = inmueble.precioVenta === null && inmueble.precioArriendo !== null
  const operacion = esArriendo ? 'Arriendo' : 'Venta'
  const badgeBg   = esArriendo ? 'bg-[#df500c]' : 'bg-[#00b5c5]'
  const badgeTxt  = esArriendo ? 'text-white' : 'text-[#001124]'

  return (
    <article className="group bg-white border border-[#d8dfe4] rounded-[18px] overflow-hidden p-px flex flex-col hover:shadow-[0_8px_32px_rgba(0,17,36,0.10)] hover:-translate-y-0.5 transition-all duration-300">
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
        {/* Botón favorito */}
        <button type="button" aria-label="Guardar en favoritos"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-2xl bg-[rgba(255,255,255,0.85)] flex items-center justify-center hover:bg-white transition-colors">
          <img src={imgHeart} alt="" className="w-[15px] h-[15px]" aria-hidden="true" />
        </button>
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
        <div className="flex items-center gap-[5px] pb-2.5">
          <img src={imgPin} alt="" className="w-[13px] h-[13px] shrink-0" aria-hidden="true" />
          <span className="text-[#7a8187] text-[13px] truncate">{inmueble.ubicacion}</span>
        </div>
        {/* Separador + specs */}
        <div className="border-t border-[#e0e5e9] pt-[15px] flex flex-wrap gap-x-[14px] gap-y-1 items-center">
          {inmueble.areaConstruidaM2 && (
            <span className="flex items-center gap-[5px]">
              <img src={imgArea} alt="" className="w-[13px] h-[13px]" aria-hidden="true" />
              <span className="text-[#7a8187] text-[12px] font-medium">{inmueble.areaConstruidaM2} m²</span>
            </span>
          )}
          {inmueble.habitaciones > 0 && (
            <span className="flex items-center gap-[5px]">
              <img src={imgBed} alt="" className="w-[13px] h-[13px]" aria-hidden="true" />
              <span className="text-[#7a8187] text-[12px] font-medium">{inmueble.habitaciones} hab</span>
            </span>
          )}
          <span className="flex items-center gap-[5px]">
            <img src={imgType} alt="" className="w-[13px] h-[13px]" aria-hidden="true" />
            <span className="text-[#7a8187] text-[12px] font-medium capitalize">{inmueble.tipoInmueble}</span>
          </span>
          {inmueble.estrato && (
            <span className="text-[#7a8187] text-[12px] font-medium">Estrato {inmueble.estrato}</span>
          )}
        </div>
      </div>
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

  const filtros = useMemo<FiltroInmueblesPublico>(() => ({
    operacion: operacionValida(searchParams.get('operacion')),
    tipo:      searchParams.get('tipo') ?? undefined,
    areaMin:   numeroOVacio(searchParams.get('area_min')),
    page:      numeroOVacio(searchParams.get('page')) ?? 1,
    pageSize:  12,
  }), [searchParams])

  const { data, isLoading, isError } = usePublicaciones(filtros)

  const setFiltro = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams)
    val ? next.set(key, val) : next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const limpiar = () => setSearchParams(new URLSearchParams())

  const cambiarPagina = (p: number) => {
    const next = new URLSearchParams(searchParams)
    p === 1 ? next.delete('page') : next.set('page', String(p))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hayFiltros = useMemo(() =>
    !!(searchParams.get('operacion') || searchParams.get('tipo') ||
       searchParams.get('area_min') || searchParams.get('q')),
    [searchParams])

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
            <div className="flex items-center pl-2 shrink-0">
              <img src={imgSearch} alt="" className="w-[18px] h-[18px] opacity-40" aria-hidden="true" />
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
              <img src={imgSearch} alt="" className="w-[15px] h-[15px] invert" aria-hidden="true" />
              Buscar
            </button>
          </form>

          {/* Panel de filtros */}
          <div className="bg-white border border-[#d8dfe4] rounded-[20px] flex flex-wrap gap-4 items-end px-8 py-7 mb-5">
            <FiltroSelect id="f-tipo" label="Tipo de inmueble"
              value={searchParams.get('tipo') ?? ''}
              options={OPT_TIPO}
              onChange={(v) => setFiltro('tipo', v)} />

            {/* Operación como select */}
            <div className="flex flex-col gap-[6px] flex-1 min-w-0">
              <span className="text-[#7a8187] text-[11px] font-semibold tracking-[0.66px] uppercase">Ubicación</span>
              <input type="text"
                placeholder="Todas las zonas"
                defaultValue={searchParams.get('ubicacion') ?? ''}
                onBlur={(e) => setFiltro('ubicacion', e.target.value)}
                className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] pl-[19px] pr-4 py-[13px] text-[#0d1c27] text-[14px] outline-none focus:border-[#004b98] focus:bg-white transition-colors placeholder:text-[#7a8187]"
              />
            </div>

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
        className="fixed bottom-7 right-7 z-50 w-[52px] h-[52px] bg-[#25d366] rounded-[26px] flex items-center justify-center shadow-[0px_4px_10px_rgba(37,211,102,0.5)] hover:scale-110 transition-transform duration-200">
        <img src={imgWA} alt="" className="w-[26px] h-[26px]" aria-hidden="true" />
      </a>

    </div>
  )
}
