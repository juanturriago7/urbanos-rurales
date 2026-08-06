import { useEffect, useRef } from 'react'
import { Edificio3D } from '@/features/public/properties/components/Edificio3D'
import { PublicacionesDestacadas } from '@/features/public/properties/components/PublicacionesDestacadas'

function useParallax(factor = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fn = () => { el.style.transform = `translateY(${window.scrollY * factor}px)` }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [factor])
  return ref
}

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }),
      { threshold: 0.1 },
    )
    document.querySelectorAll('.reveal,.reveal-scale').forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
}

/* ── Íconos SVG profesionales (sin emojis) ──────────────────────── */
const IconCasa = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <path d="M4 13.5L16 3l12 10.5V28a1 1 0 01-1 1H5a1 1 0 01-1-1V13.5z" strokeLinejoin="round"/>
    <path d="M11 29V19h10v10" strokeLinejoin="round"/>
  </svg>
)
const IconApto = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <rect x="3" y="4" width="26" height="25" rx="1"/>
    <path d="M3 11h26M3 18h26M11 11v18M21 11v18"/>
  </svg>
)
const IconLocal = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <path d="M2 12l3-8h22l3 8H2zM2 12v3a3 3 0 006 0v0a3 3 0 006 0v0a3 3 0 006 0v0a3 3 0 006 0v-3"/>
    <path d="M5 29V18M27 29V18M5 29h22"/>
    <rect x="12" y="20" width="8" height="9"/>
  </svg>
)
const IconFinca = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <path d="M2 28h28M6 28V16l4-4 4 4v12M18 28V12l5-6 5 6v16"/>
    <path d="M6 20h8M18 16h10"/>
    <circle cx="10" cy="8" r="3"/>
  </svg>
)
const IconOficina = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <rect x="3" y="2" width="26" height="28" rx="1"/>
    <path d="M3 10h26M10 2v8M22 2v8"/>
    <rect x="8" y="15" width="5" height="5" rx="0.5"/>
    <rect x="19" y="15" width="5" height="5" rx="0.5"/>
    <rect x="8" y="23" width="5" height="7"/>
    <rect x="19" y="23" width="5" height="7"/>
  </svg>
)
const IconLote = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <path d="M3 26L10 6l9 12 5-6 5 14H3z" strokeLinejoin="round"/>
    <path d="M3 30h26"/>
    <circle cx="21" cy="9" r="2.5"/>
  </svg>
)
const IconPredial = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <rect x="3" y="5" width="26" height="22" rx="1"/>
    <path d="M3 12h26M10 5v7M22 5v7"/>
    <path d="M8 17h4M8 21h8M20 17h4"/>
  </svg>
)
const IconAvaluo = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <circle cx="16" cy="16" r="13"/>
    <path d="M16 9v7l4 4" strokeLinecap="round"/>
    <path d="M10 4.5l2 2M22 4.5l-2 2"/>
  </svg>
)
const IconTopo = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <path d="M2 24l7-10 6 6 6-12 9 16H2z" strokeLinejoin="round"/>
    <circle cx="22" cy="7" r="3"/>
    <path d="M22 10v3M19.5 8.5l-2 2"/>
  </svg>
)
const IconConsultoria = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <circle cx="16" cy="10" r="5"/>
    <path d="M5 28c0-5.523 4.925-10 11-10s11 4.477 11 10"/>
    <path d="M21 18l3 3-1.5 6M11 18l-3 3 1.5 6"/>
  </svg>
)
const IconVenta = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
    <path d="M3 16L16 3l13 13v13H20v-8h-8v8H3V16z" strokeLinejoin="round"/>
    <circle cx="16" cy="21" r="2"/>
  </svg>
)
const IconArrow = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M2 7h10M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* ── Datos reales del sitio ─────────────────────────────────────── */
const SERVICIOS = [
  { Icon: IconPredial,    titulo: 'Gestión Predial Integral',    sub: 'Adquisición predial para entidades públicas y privadas.',       href: '/inmuebles' },
  { Icon: IconAvaluo,     titulo: 'Avalúos',                    sub: 'Equipo certificado en todo el territorio nacional.',            href: '/inmuebles' },
  { Icon: IconTopo,       titulo: 'Topografía',                 sub: 'Levantamientos topográficos y servicios cartográficos.',        href: '/inmuebles' },
  { Icon: IconConsultoria,titulo: 'Consultoría Predial',        sub: 'Ingeniería, derecho y economía a nivel nacional.',              href: '/inmuebles' },
  { Icon: IconVenta,      titulo: 'Comercialización',           sub: 'Compra, venta y arriendo con acompañamiento integral.',         href: '/inmuebles' },
]

const TIPOS_INMUEBLE = [
  { Icon: IconCasa,    titulo: 'Casas',         sub: 'Espacios amplios para vivir',       href: '/inmuebles?tipo=casa' },
  { Icon: IconApto,    titulo: 'Apartamentos',  sub: 'Confort urbano en altura',           href: '/inmuebles?tipo=apartamento' },
  { Icon: IconLocal,   titulo: 'Locales',       sub: 'Estratégicos para tu negocio',       href: '/inmuebles?tipo=local' },
  { Icon: IconFinca,   titulo: 'Fincas',        sub: 'Paz y naturaleza garantizadas',      href: '/inmuebles?tipo=finca' },
  { Icon: IconOficina, titulo: 'Oficinas',      sub: 'Espacios modernos para crecer',      href: '/inmuebles?tipo=oficina' },
  { Icon: IconLote,    titulo: 'Lotes',         sub: 'Construye tu visión',                href: '/inmuebles?tipo=lote' },
]

const PROYECTOS = [
  { img: 'https://urbanosrurales.com/wp-content/uploads/elementor/thumbs/IMG_20241121_123448-1-scaled-r3tlic29kcnofbn6q3y74ljhkj7os94iekvt00qk5k.jpg', cliente: 'Compensar', desc: 'Firma consultora para trámites inmobiliarios.' },
  { img: 'https://urbanosrurales.com/wp-content/uploads/elementor/thumbs/WhatsApp-Image-2025-04-03-at-10.48.20-AM-1-r3tlabhta7onf1acj57qd4cz78q056awywlqo2mf7s.jpeg', cliente: 'Grupo Energía Bogotá', desc: 'Saneamiento técnico y jurídico de 1.461 predios en el Embalse de Tominé.' },
  { img: 'https://urbanosrurales.com/wp-content/uploads/elementor/thumbs/WhatsApp-Image-2025-04-03-at-10.39.01-AM-r3tl4s811c3v1pbsur2toin99k06tcbtjiasxetvuw.jpeg', cliente: 'Alcaldía Rafael Uribe Uribe', desc: 'Formalización y legalización de títulos de la localidad.' },
  { img: 'https://urbanosrurales.com/wp-content/uploads/elementor/thumbs/DSC_0119-scaled-qs7w8y3alb3vx27p7te47pmt100ea8c77h8u6v0cy0.jpg', cliente: 'Fondo Nacional del Ahorro', desc: 'Avalúos de inmuebles a nivel nacional para garantías hipotecarias.' },
  { img: 'https://urbanosrurales.com/wp-content/uploads/elementor/thumbs/2333-qrvw2cba60jtq9yejiuxavduzqe76rr7fj8lhrwpl4.jpg', cliente: 'Universidad El Bosque', desc: 'Inventario y valuación de bienes de propiedad planta y equipo.' },
  { img: 'https://urbanosrurales.com/wp-content/uploads/elementor/thumbs/QE-qrvvzd5oiwh4yqa1x8jgemfb9t2ct9xt0sv8s8blag.jpg', cliente: 'Secretaría de Educación Distrital', desc: 'Saneamiento predial de 279 inmuebles en 65 sedes educativas.' },
]

const CLIENTES = [
  { src: 'https://urbanosrurales.com/wp-content/uploads/2024/07/Logo-compensar-300x75-1.png', alt: 'Compensar' },
  { src: 'https://urbanosrurales.com/wp-content/uploads/2024/07/logoani.png', alt: 'ANI' },
  { src: 'https://urbanosrurales.com/wp-content/uploads/2024/07/1526258566-300x158-1.png', alt: 'Cliente' },
  { src: 'https://urbanosrurales.com/wp-content/uploads/2024/07/articles-60980_img_banner-300x82-1.png', alt: 'Cliente' },
  { src: 'https://urbanosrurales.com/wp-content/uploads/2024/07/WhatsApp-Image-2020-07-02-at-4.42.11-PM-01-01-300x141-1.png', alt: 'Cliente' },
  { src: 'https://urbanosrurales.com/wp-content/uploads/2024/07/descarga-46.jpg', alt: 'Cliente' },
  { src: 'https://urbanosrurales.com/wp-content/uploads/2024/07/descarga-38-1.png', alt: 'Cliente' },
]

/* ── Componente principal ───────────────────────────────────────── */
export function HomePage() {
  useReveal()
  const parallaxText = useParallax(0.06)
  const parallaxOrb  = useParallax(0.16)

  return (
    <div className="bg-[#faf8f5]">

      {/* ════════════════════════════════════════════════════════
          HERO — split: texto izquierda, 3D derecha
          ════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #f2ede4 0%, #faf8f5 60%, #ede8df 100%)' }}
      >
        {/* Grano de papel */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '180px' }}
          aria-hidden="true" />

        {/* Orbe bronce parallax */}
        <div ref={parallaxOrb}
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 70% 40%, #e8d5b7 0%, #c4a882 35%, transparent 70%)' }}
          aria-hidden="true" />

        {/* Grid — texto + 3D */}
        <div className="relative z-10 mx-auto grid min-h-screen max-w-350 grid-cols-1 items-center gap-0 px-6 sm:px-10 lg:grid-cols-2">

          {/* Columna texto */}
          <div ref={parallaxText} className="pt-32 pb-16 lg:pb-24 lg:pr-12">
            <div className="reveal mb-8 flex items-center gap-4" style={{ transitionDelay: '0ms' }}>
              <span className="h-px w-10 bg-[#8b6f4e]/50" />
              <span className="text-[9px] font-bold tracking-[4px] uppercase text-[#8b6f4e]">
                Desde 1996 · Bogotá, Colombia
              </span>
            </div>

            <h1 className="reveal font-serif font-bold leading-[1.06] tracking-[-0.02em] text-[#1c1917]"
              style={{ fontSize: 'clamp(40px, 5.5vw, 80px)', transitionDelay: '80ms' }}>
              Conocemos el<br />
              territorio para<br />
              <em className="not-italic text-[#8b6f4e]">viabilizar</em><br />
              sus proyectos.
            </h1>

            <p className="reveal mt-6 max-w-sm text-[16px] font-light leading-[1.8] text-[#1c1917]/50"
              style={{ transitionDelay: '160ms' }}>
              Consultorías, avalúos, gestión predial y comercialización
              de inmuebles en todo el territorio nacional.
            </p>

            <div className="reveal mt-9 flex flex-wrap gap-3" style={{ transitionDelay: '240ms' }}>
              <a href="/inmuebles"
                className="group inline-flex items-center gap-3 rounded-sm bg-[#1c1917] px-7 py-3.5 text-[10px] font-bold tracking-[2px] uppercase text-[#faf8f5] shadow-[0_4px_20px_rgba(28,25,23,0.18)] transition-all duration-300 hover:bg-[#8b6f4e] hover:shadow-[0_6px_24px_rgba(139,111,78,0.3)] hover:scale-[1.02]">
                Ver inmuebles
                <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#consignar"
                className="inline-flex items-center gap-2 rounded-sm border border-[#1c1917]/20 px-7 py-3.5 text-[10px] font-bold tracking-[2px] uppercase text-[#1c1917]/60 transition-all duration-300 hover:border-[#8b6f4e] hover:text-[#8b6f4e]">
                Consignar propiedad
              </a>
            </div>

            {/* Stats */}
            <div className="reveal mt-12 flex gap-10" style={{ transitionDelay: '320ms' }}>
              {[{ n: '+18', label: 'Años de experiencia' }, { n: '+500', label: 'Proyectos realizados' }, { n: '32', label: 'Ciudades' }].map(({ n, label }) => (
                <div key={label}>
                  <p className="font-serif text-[28px] font-bold leading-none text-[#1c1917]">{n}</p>
                  <p className="mt-1.5 text-[8.5px] font-semibold tracking-[2px] uppercase text-[#1c1917]/35">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 3D — Three.js edificio construido con geometrías propias */}
          <div className="reveal-scale relative hidden min-h-screen items-center justify-center lg:flex" style={{ transitionDelay: '200ms' }}>
            <Edificio3D />
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40" aria-hidden="true">
          <div className="h-10 w-px bg-[#1c1917]/30" />
          <span className="text-[8px] font-bold tracking-[3px] uppercase text-[#1c1917]/40">Scroll</span>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PUBLICACIONES — directo debajo del hero, sin clic previo
          ════════════════════════════════════════════════════════ */}
      <PublicacionesDestacadas />

      {/* ════════════════════════════════════════════════════════
          TIPOS DE INMUEBLE
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10 max-w-350 mx-auto">
        <div className="reveal mb-14 flex items-end justify-between gap-4">
          <div>
            <span className="text-[9px] font-bold tracking-[4px] uppercase text-[#8b6f4e]">Portafolio</span>
            <h2 className="mt-2 font-serif text-[34px] font-bold leading-tight text-[#1c1917]">Explora por tipo de inmueble</h2>
          </div>
          <a href="/inmuebles" className="hidden sm:inline-flex items-center gap-2 text-[10px] font-bold tracking-[2px] uppercase text-[#8b6f4e] hover:text-[#735840] transition-colors">
            Ver todo <IconArrow />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TIPOS_INMUEBLE.map(({ Icon, titulo, sub, href }, i) => (
            <a key={titulo} href={href}
              className="reveal group flex flex-col items-start gap-4 rounded-sm border border-border bg-white p-6 hover:border-[#8b6f4e]/40 hover:shadow-[0_8px_32px_rgba(28,25,23,0.07)] transition-all duration-300"
              style={{ transitionDelay: `${i * 50}ms` }}>
              <span className="text-[#8b6f4e]/70 group-hover:text-[#8b6f4e] transition-colors duration-300">
                <Icon />
              </span>
              <div>
                <p className="font-serif text-[17px] font-bold leading-tight text-[#1c1917]">{titulo}</p>
                <p className="mt-1 text-[12px] leading-snug text-[#1c1917]/40">{sub}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          QUIÉNES SOMOS — banda oscura de impacto
          ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#1c1917] py-24 px-6 sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '180px' }}
          aria-hidden="true" />
        <div className="relative mx-auto max-w-350">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <div>
              <div className="reveal flex items-center gap-4 mb-8">
                <span className="h-px w-10 bg-[#8b6f4e]/60" />
                <span className="text-[9px] font-bold tracking-[4px] uppercase text-[#8b6f4e]">Quiénes somos</span>
              </div>
              <h2 className="reveal font-serif text-[clamp(32px,4vw,56px)] font-bold leading-[1.1] text-[#faf8f5]"
                style={{ transitionDelay: '80ms' }}>
                Expertos que conocen<br />el territorio colombiano.
              </h2>
              <p className="reveal mt-6 text-[16px] font-light leading-[1.8] text-[#faf8f5]/50 max-w-md"
                style={{ transitionDelay: '160ms' }}>
                Desde 1996, URBANOS &amp; RURALES S.A.S trabaja con un equipo interdisciplinario
                de ingenieros, arquitectos, abogados, trabajadores sociales y economistas,
                comprometidos con el desarrollo del país.
              </p>
              <div className="reveal mt-8 flex flex-wrap gap-6" style={{ transitionDelay: '240ms' }}>
                {[
                  { label: 'ISO 9001', sub: 'Certificación de calidad' },
                  { label: 'ISO 14001', sub: 'Gestión ambiental' },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-[#8b6f4e]/60 flex items-center justify-center">
                      <svg className="h-2.5 w-2.5 text-[#8b6f4e]" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold tracking-[1px] uppercase text-[#faf8f5]/80">{label}</p>
                      <p className="text-[11px] text-[#faf8f5]/35">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal-scale grid grid-cols-2 gap-4" style={{ transitionDelay: '100ms' }}>
              {SERVICIOS.map(({ Icon, titulo, sub }, i) => (
                <div key={titulo}
                  className={`flex flex-col gap-3 rounded-sm border border-[#faf8f5]/06 bg-[#faf8f5]/03 p-6 hover:border-[#8b6f4e]/30 hover:bg-[#8b6f4e]/05 transition-all duration-300${i === 4 ? ' col-span-2' : ''}`}>
                  <span className="text-[#8b6f4e]/70"><Icon /></span>
                  <p className="font-serif text-[15px] font-bold leading-snug text-[#faf8f5]/80">{titulo}</p>
                  <p className="text-[12px] leading-relaxed text-[#faf8f5]/35">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PROYECTOS REALIZADOS — imágenes reales
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10">
        <div className="mx-auto max-w-350">
          <div className="reveal mb-14 flex items-end justify-between gap-4">
            <div>
              <span className="text-[9px] font-bold tracking-[4px] uppercase text-[#8b6f4e]">Trayectoria</span>
              <h2 className="mt-2 font-serif text-[34px] font-bold leading-tight text-[#1c1917]">Proyectos realizados</h2>
            </div>
            <a href="https://urbanosrurales.com/proyecto" target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 text-[10px] font-bold tracking-[2px] uppercase text-[#8b6f4e] hover:text-[#735840] transition-colors">
              Ver todos <IconArrow />
            </a>
          </div>

          {/* Mosaico asimétrico */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROYECTOS.map(({ img, cliente, desc }, i) => (
              <div key={cliente}
                className={`reveal group relative overflow-hidden rounded-sm bg-[#1c1917]${i === 0 ? ' sm:row-span-2 sm:col-span-1' : ''}`}
                style={{ transitionDelay: `${i * 70}ms`, minHeight: i === 0 ? '480px' : '220px' }}>
                <img src={img} alt={cliente} loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-linear-to-t from-[#1c1917]/90 via-[#1c1917]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[9px] font-bold tracking-[2.5px] uppercase text-accent-gold/80 mb-1">{cliente}</p>
                  <p className="text-[14px] font-light leading-snug text-[#faf8f5]/80">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CLIENTES — logos reales
          ════════════════════════════════════════════════════════ */}
      <section className="border-y border-border bg-white py-16 px-6 sm:px-10">
        <div className="mx-auto max-w-350">
          <p className="reveal mb-10 text-center text-[9px] font-bold tracking-[4px] uppercase text-[#1c1917]/30">
            Algunos de nuestros clientes
          </p>
          <div className="reveal flex flex-wrap items-center justify-center gap-10 opacity-60"
            style={{ transitionDelay: '80ms' }}>
            {CLIENTES.map(({ src, alt }) => (
              <img key={alt + src} src={src} alt={alt} loading="lazy"
                className="h-8 w-auto max-w-25 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA CONSIGNAR
          ════════════════════════════════════════════════════════ */}
      <section id="consignar" className="py-28 px-6 sm:px-10">
        <div className="mx-auto max-w-200 text-center">
          <div className="reveal flex justify-center mb-8">
            <span className="h-px w-12 bg-[#8b6f4e]/40 self-center mr-4" />
            <span className="text-[9px] font-bold tracking-[4px] uppercase text-[#8b6f4e]">Consignar</span>
            <span className="h-px w-12 bg-[#8b6f4e]/40 self-center ml-4" />
          </div>
          <h2 className="reveal font-serif text-[clamp(32px,4.5vw,60px)] font-bold leading-[1.1] text-[#1c1917]"
            style={{ transitionDelay: '80ms' }}>
            ¿Tienes una propiedad<br />para vender o arrendar?
          </h2>
          <p className="reveal mt-5 text-[16px] font-light leading-[1.8] text-[#1c1917]/50"
            style={{ transitionDelay: '160ms' }}>
            Te acompañamos en todo el proceso: avalúo, estrategia de marketing,
            escrituración y cierre. Con más de 18 años de experiencia en el mercado colombiano.
          </p>
          <div className="reveal mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            style={{ transitionDelay: '240ms' }}>
            <a href="https://urbanosrurales.com/contacto" target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-sm bg-[#1c1917] px-8 py-4 text-[10px] font-bold tracking-[2px] uppercase text-[#faf8f5] shadow-[0_4px_20px_rgba(28,25,23,0.18)] transition-all duration-300 hover:bg-[#8b6f4e] hover:scale-[1.02]">
              Contactar ahora
              <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="tel:+5714557844"
              className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[2px] uppercase text-[#1c1917]/50 hover:text-[#8b6f4e] transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 5a2 2 0 012-2h1.5a1 1 0 01.95.68l1 3a1 1 0 01-.23 1.05L7 8.9a11 11 0 004.1 4.1l1.17-1.22a1 1 0 011.05-.23l3 1a1 1 0 01.68.95V15a2 2 0 01-2 2C7.163 17 3 12.837 3 7V5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              +57 (1) 455 7844
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
