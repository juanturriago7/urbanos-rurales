import { BedDouble, House, MapPin, Ruler } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useInmuebleDetalle } from '@/features/public/properties/hooks/usePublicaciones'
import type {
  CaracteristicaValorDto,
  ImagenDto,
  OperacionDto,
} from '@/features/public/properties/api/inmueblesPublicApi'
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon'
import { site } from '@/shared/config/site'

/* ── Helpers ─────────────────────────────────────────────────── */
const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
})

function formatOperacion(op: OperacionDto): string {
  const pesos = formatoPesos.format(op.precio)
  return op.tipoOperacion === 'arriendo' ? `${pesos}/mes` : pesos
}

function ordenarImagenes(imagenes: ImagenDto[]): ImagenDto[] {
  return [...imagenes].sort((a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden)
}

function agruparCaracteristicas(items: CaracteristicaValorDto[]): [string, CaracteristicaValorDto[]][] {
  const grupos = new Map<string, CaracteristicaValorDto[]>()
  for (const item of items) {
    const lista = grupos.get(item.categoria) ?? []
    lista.push(item)
    grupos.set(item.categoria, lista)
  }
  return [...grupos.entries()]
}

/* ── Icono simple (baño, sin asset Figma disponible) ────────────── */
function IconBath() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z" strokeLinejoin="round" />
      <path d="M6 12V6a2 2 0 0 1 2-2c1 0 1.6.5 2 1" strokeLinecap="round" />
      <path d="M4 19v1M18 19v1" strokeLinecap="round" />
    </svg>
  )
}

/* ── Galería con lightbox ────────────────────────────────────── */
function Galeria({ imagenes, titulo }: { imagenes: ImagenDto[]; titulo: string }) {
  const [indice, setIndice] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!lightbox) return
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setIndice((i) => (i + 1) % imagenes.length)
      if (e.key === 'ArrowLeft') setIndice((i) => (i - 1 + imagenes.length) % imagenes.length)
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [lightbox, imagenes.length])

  if (imagenes.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-[18px]"
        style={{ background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)' }}>
        <span className="px-4 text-center text-[13px] text-[rgba(255,255,255,0.5)]">
          Sin fotografías disponibles
        </span>
      </div>
    )
  }

  const actual = imagenes[indice]

  return (
    <div>
      <button type="button" onClick={() => setLightbox(true)}
        className="block aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-[18px] bg-[#e0e5e9]">
        <img src={actual.urlCdn} alt={actual.textoAlt ?? titulo}
          className="h-full w-full object-cover" />
      </button>

      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {imagenes.map((img, i) => (
            <button key={img.id} type="button" onClick={() => setIndice(i)}
              aria-label={`Ver fotografía ${i + 1}`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-[10px] border-2 transition-colors ${
                i === indice ? 'border-[#004b98]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}>
              <img src={img.urlThumbnail ?? img.urlCdn} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={`Galería de fotos — ${titulo}`}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}>
          <button type="button" onClick={() => setLightbox(false)} aria-label="Cerrar galería"
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            ✕
          </button>

          <img src={actual.urlCdn} alt={actual.textoAlt ?? titulo}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-[10px] object-contain" />

          {imagenes.length > 1 && (
            <div className="mt-4 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-label="Foto anterior"
                onClick={() => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                ←
              </button>
              <span className="text-[13px] text-white/70">{indice + 1} / {imagenes.length}</span>
              <button type="button" aria-label="Foto siguiente"
                onClick={() => setIndice((i) => (i + 1) % imagenes.length)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Skeleton de carga ───────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse px-12 py-10">
      <div className="aspect-[16/9] w-full rounded-[18px] bg-[#e0e5e9]" />
      <div className="mt-6 h-8 w-1/3 rounded bg-[#e0e5e9]" />
      <div className="mt-3 h-5 w-2/3 rounded bg-[#e0e5e9]" />
      <div className="mt-8 h-4 w-full rounded bg-[#e0e5e9]" />
      <div className="mt-2 h-4 w-5/6 rounded bg-[#e0e5e9]" />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════════════════════════════ */
export function InmuebleDetallePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: inmueble, isLoading, isError } = useInmuebleDetalle(slug)

  const imagenesOrdenadas = useMemo(
    () => (inmueble ? ordenarImagenes(inmueble.imagenes) : []),
    [inmueble],
  )
  const caracteristicasAgrupadas = useMemo(
    () => (inmueble ? agruparCaracteristicas(inmueble.caracteristicas) : []),
    [inmueble],
  )

  if (isLoading) {
    return <div className="min-h-screen bg-[#eff4f8] font-['Outfit',sans-serif]"><Skeleton /></div>
  }

  if (isError || !inmueble) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eff4f8] px-6 text-center font-['Outfit',sans-serif]">
        <p className="text-[22px] font-bold text-[#001124]">No encontramos este inmueble</p>
        <p className="text-[15px] text-[#7a8187]">Puede que ya no esté disponible o el enlace sea incorrecto.</p>
        <Link to="/inmuebles"
          className="mt-2 rounded-[10px] bg-[#004b98] px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#003b7a]">
          Ver todas las propiedades
        </Link>
      </div>
    )
  }

  const ventaOp = inmueble.operaciones.find((o) => o.tipoOperacion === 'venta' && o.activo)
  const arriendoOp = inmueble.operaciones.find((o) => o.tipoOperacion === 'arriendo' && o.activo)
  const ubicacionTexto = inmueble.ubicacion.map((u) => u.nombre).join(' · ')

  const mensajeWA = `Hola, estoy interesado en el inmueble ${inmueble.codigoReferencia} - ${inmueble.titulo}. ¿Podrían darme más información?`
  const urlWA = `https://wa.me/${site.contacto.whatsapp}?text=${encodeURIComponent(mensajeWA)}`

  return (
    <div className="min-h-screen bg-[#eff4f8] font-['Outfit',sans-serif]">
      <div className="mx-auto max-w-[1200px] px-12 py-10">
        {/* Volver */}
        <Link to="/inmuebles"
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#7a8187] transition-colors hover:text-[#004b98]">
          ← Volver a inmuebles
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* ── Columna principal ── */}
          <div>
            <Galeria imagenes={imagenesOrdenadas} titulo={inmueble.titulo} />

            <div className="mt-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.5px] text-[#001124]">
                    {inmueble.titulo}
                  </h1>
                  <div className="mt-2 flex items-center gap-[6px] text-[#7a8187]">
                    <MapPin className="h-[14px] w-[14px] shrink-0" aria-hidden="true" />
                    <span className="text-[14px] text-[#7a8187]">{ubicacionTexto || 'Ubicación no especificada'}</span>
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[16px] border border-[#d8dfe4] bg-white px-6 py-5">
                {/* Spec 03 — área de terreno si no es PH; área construida si es PH.
                    Backend garantiza que el campo correcto viene poblado. */}
                {!inmueble.esPropiedadHorizontal && inmueble.areaTerrenoM2 && (
                  <span className="flex items-center gap-[7px] text-[#001124]">
                    <Ruler className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-[#001124]">
                      {inmueble.areaTerrenoM2} m² de terreno
                    </span>
                  </span>
                )}
                {inmueble.areaConstruidaM2 && (
                  <span className="flex items-center gap-[7px] text-[#001124]">
                    <Ruler className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-[#001124]">{inmueble.areaConstruidaM2} m² construidos</span>
                  </span>
                )}
                {inmueble.habitaciones > 0 && (
                  <span className="flex items-center gap-[7px] text-[#001124]">
                    <BedDouble className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-[#001124]">{inmueble.habitaciones} habitaciones</span>
                  </span>
                )}
                {inmueble.banos > 0 && (
                  <span className="flex items-center gap-[7px] text-[#001124]">
                    <IconBath />
                    <span className="text-[13px] font-medium">{inmueble.banos} baños</span>
                  </span>
                )}
                {inmueble.parqueaderos > 0 && (
                  <span className="text-[13px] font-medium text-[#001124]">{inmueble.parqueaderos} parqueaderos</span>
                )}
                <span className="flex items-center gap-[7px] text-[#001124]">
                  <House className="h-4 w-4" aria-hidden="true" />
                  <span className="text-[13px] font-medium text-[#001124] capitalize">{inmueble.tipoInmueble}</span>
                </span>
                {inmueble.estrato && (
                  <span className="text-[13px] font-medium text-[#001124]">Estrato {inmueble.estrato}</span>
                )}
              </div>

              {/* Descripción */}
              {inmueble.descripcion && (
                <div className="mt-8">
                  <h2 className="text-[17px] font-bold text-[#001124]">Descripción</h2>
                  <p className="mt-3 text-[14px] leading-[1.75] whitespace-pre-line text-[#44403c]">
                    {inmueble.descripcion}
                  </p>
                </div>
              )}

              {/* Spec 03 — video (YouTube embebido) */}
              {inmueble.youtubeUrl && (() => {
                // Acepta watch?v=, youtu.be/, /embed/, /shorts/. Extrae el ID.
                const id = (() => {
                  try {
                    const u = new URL(inmueble.youtubeUrl)
                    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
                    if (u.pathname.startsWith('/embed/')) return u.pathname.slice(7)
                    if (u.pathname.startsWith('/shorts/')) return u.pathname.slice(8)
                    return u.searchParams.get('v') ?? ''
                  } catch { return '' }
                })()
                if (!id) return null
                return (
                  <div className="mt-8">
                    <h2 className="text-[17px] font-bold text-[#001124]">Video</h2>
                    <div className="relative mt-3 overflow-hidden rounded-[16px] border border-[#d8dfe4] bg-white"
                      style={{ aspectRatio: '16/9' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${id}`}
                        title="Video del inmueble"
                        // "fullscreen" es imprescindible en `allow`: Chrome ignora el
                        // atributo legado allowFullScreen en cuanto hay un `allow`
                        // explícito sin ese permiso ("Allow attribute will take
                        // precedence over 'allowfullscreen'"), y el botón de
                        // pantalla completa del reproductor queda muerto — verificado
                        // en vivo con y sin el permiso.
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="absolute inset-0 h-full w-full"
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Spec 03 — ubicación en mapa (Google Maps embed) */}
              {inmueble.mapaEmbedUrl && (
                <div className="mt-8">
                  <h2 className="text-[17px] font-bold text-[#001124]">Ubicación</h2>
                  <div className="relative mt-3 overflow-hidden rounded-[16px] border border-[#d8dfe4] bg-white"
                    style={{ aspectRatio: '16/9' }}>
                    <iframe
                      src={inmueble.mapaEmbedUrl}
                      title="Ubicación del inmueble"
                      loading="lazy"
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
              )}

              {/* Detalles adicionales */}
              <div className="mt-8">
                <h2 className="text-[17px] font-bold text-[#001124]">Detalles del inmueble</h2>
                <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 rounded-[16px] border border-[#d8dfe4] bg-white p-6 sm:grid-cols-2">
                  {inmueble.areaPrivadaM2 && (
                    <div className="flex justify-between border-b border-[#eff4f8] pb-2 text-[13px]">
                      <dt className="text-[#7a8187]">Área privada</dt>
                      <dd className="font-semibold text-[#001124]">{inmueble.areaPrivadaM2} m²</dd>
                    </div>
                  )}
                  {inmueble.piso && (
                    <div className="flex justify-between border-b border-[#eff4f8] pb-2 text-[13px]">
                      <dt className="text-[#7a8187]">Piso</dt>
                      <dd className="font-semibold text-[#001124]">{inmueble.piso}</dd>
                    </div>
                  )}
                  {inmueble.pisosEdificio && (
                    <div className="flex justify-between border-b border-[#eff4f8] pb-2 text-[13px]">
                      <dt className="text-[#7a8187]">Pisos del edificio</dt>
                      <dd className="font-semibold text-[#001124]">{inmueble.pisosEdificio}</dd>
                    </div>
                  )}
                  {inmueble.antiguedad && (
                    <div className="flex justify-between border-b border-[#eff4f8] pb-2 text-[13px]">
                      <dt className="text-[#7a8187]">Antigüedad</dt>
                      <dd className="font-semibold text-[#001124] capitalize">{inmueble.antiguedad}</dd>
                    </div>
                  )}
                  {inmueble.orientacion && (
                    <div className="flex justify-between border-b border-[#eff4f8] pb-2 text-[13px]">
                      <dt className="text-[#7a8187]">Orientación</dt>
                      <dd className="font-semibold text-[#001124] capitalize">{inmueble.orientacion}</dd>
                    </div>
                  )}
                  {inmueble.amoblado && (
                    <div className="flex justify-between border-b border-[#eff4f8] pb-2 text-[13px]">
                      <dt className="text-[#7a8187]">Amoblado</dt>
                      <dd className="font-semibold text-[#001124] capitalize">{inmueble.amoblado}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-[#eff4f8] pb-2 text-[13px]">
                    <dt className="text-[#7a8187]">Mascotas</dt>
                    <dd className="font-semibold text-[#001124] capitalize">{inmueble.politicaMascotas}</dd>
                  </div>
                </dl>
              </div>

              {/* Características */}
              {caracteristicasAgrupadas.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-[17px] font-bold text-[#001124]">Características</h2>
                  <div className="mt-3 space-y-5">
                    {caracteristicasAgrupadas.map(([categoria, items]) => (
                      <div key={categoria}>
                        <p className="text-[11px] font-semibold tracking-[0.66px] text-[#7a8187] uppercase">
                          {categoria}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {items.map((c) => (
                            <span key={c.caracteristicaId}
                              className="rounded-full border border-[#d8dfe4] bg-white px-4 py-2 text-[13px] font-medium text-[#001124]">
                              {c.nombre}{c.valor ? `: ${c.valor}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar de contacto ── */}
          <aside className="h-fit rounded-[18px] border border-[#d8dfe4] bg-white p-6 lg:sticky lg:top-[110px]">
            {(ventaOp || arriendoOp) && (
              <div className="mb-5 space-y-1">
                {ventaOp && (
                  <p className="text-[24px] leading-none font-extrabold tracking-[-0.5px] text-[#004b98]">
                    {formatOperacion(ventaOp)}
                  </p>
                )}
                {arriendoOp && (
                  <p className={ventaOp
                    ? 'text-[15px] font-semibold text-[#7a8187]'
                    : 'text-[24px] leading-none font-extrabold tracking-[-0.5px] text-[#004b98]'}>
                    {formatOperacion(arriendoOp)} {ventaOp && '(arriendo)'}
                  </p>
                )}
              </div>
            )}

            <a href={urlWA} target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-[12px] bg-[#25d366] px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-[#1ebc59]">
              <WhatsAppIcon className="h-5 w-5" />
              Contactar
            </a>
            <p className="mt-3 text-center text-[12px] text-[#7a8187]">
              Te atenderemos por WhatsApp en minutos
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
