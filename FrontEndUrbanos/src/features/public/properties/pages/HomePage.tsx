import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  ChevronDown,
  ClipboardList,
  Clock,
  Compass,
  Handshake,
  Mail,
  Map,
  MapPin,
  Phone,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PublicacionesDestacadas } from '@/features/public/properties/components/PublicacionesDestacadas'
import { ClientesCarrusel } from '@/features/public/institucional/components/ClientesCarrusel'
import { useCrearLead } from '@/features/public/contacto/hooks/useCrearLead'
import { useScrollReveal } from '@/shared/hooks/useScrollReveal'
import { Container } from '@/shared/components/ui/Container'
import { Foto } from '@/shared/components/ui/Foto'
import { FOTOS } from '@/assets/fotos'
import { site } from '@/shared/config/site'

/* ── Servicios ─────────────────────────────────────────────────── */
const SERVICIOS = [
  { num: '01', Icon: ClipboardList, titulo: 'Consultoría y Asesoría Predial',
    desc: 'Procesos de consultoría y asesoría en ingeniería, derecho, economía y otras especialidades para entidades públicas y privadas.' },
  { num: '02', Icon: Briefcase, titulo: 'Gestión Predial Integral',
    desc: 'Acompañamiento estricto en la adquisición predial integral a entidades públicas y privadas, brindando asesoría completa.' },
  { num: '03', Icon: Calculator,  titulo: 'Avalúos',
    desc: 'Realización de avalúos con un equipo de especialistas altamente calificados y con certificación a lo largo del territorio nacional.' },
  { num: '04', Icon: Compass,    titulo: 'Topografía',
    desc: 'Levantamientos topográficos y servicios cartográficos a entidades privadas y particulares con cobertura nacional.' },
]

/* ── Certificaciones (spec 08 — plantilla a completar con datos reales) ── */
const CERTIFICACIONES_PLANTILLA = [
  'ISO 9001 — Gestión de Calidad',
  'ISO 14001 — Gestión Ambiental',
  'ITICOL Certificado',
]

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export function HomePage() {
  useScrollReveal()
  const location = useLocation()

  /**
   * Si se llega desde otra página vía "/#ancla" (ej. click en "Líneas de
   * servicio" desde la ficha de un inmueble), hace scroll al ancla una vez
   * montado el contenido.
   */
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 120)
    return () => clearTimeout(t)
  }, [location.hash])

  /* ── Formulario de contacto ──────────────────────────────────── */
  const crearLead = useCrearLead()
  const [contacto, setContacto] = useState({
    nombre: '',
    telefono: '',
    email: '',
    servicio: '',
    mensaje: '',
    aceptoDatos: false,
  })
  const [sitio, setSitio] = useState('') // honeypot anti-spam — un humano nunca lo llena
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)
  const [envioExitoso, setEnvioExitoso] = useState(false)

  function actualizarContacto<K extends keyof typeof contacto>(campo: K, valor: (typeof contacto)[K]) {
    setEnvioExitoso(false)
    setContacto((prev) => ({ ...prev, [campo]: valor }))
  }

  function seleccionarServicio(servicio: string) {
    actualizarContacto('servicio', servicio)
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleEnviarContacto(e: React.FormEvent) {
    e.preventDefault()
    setErrorValidacion(null)

    if (!contacto.nombre.trim()) {
      setErrorValidacion('Ingresa tu nombre completo.')
      return
    }
    if (!contacto.email.trim() && !contacto.telefono.trim()) {
      setErrorValidacion('Indica al menos un correo o un teléfono de contacto.')
      return
    }
    if (!contacto.aceptoDatos) {
      setErrorValidacion('Debes aceptar el tratamiento de tus datos personales.')
      return
    }

    try {
      await crearLead.mutateAsync({
        nombre: contacto.nombre.trim(),
        correo: contacto.email.trim() || undefined,
        telefono: contacto.telefono.trim() || undefined,
        mensaje:
          [
            contacto.servicio && `Servicio de interés: ${contacto.servicio}`,
            contacto.mensaje.trim(),
          ]
            .filter(Boolean)
            .join('\n\n') || undefined,
        origen: 'formulario_general',
        aceptoTratamientoDatos: contacto.aceptoDatos,
        sitio: sitio || undefined,
      })
      setEnvioExitoso(true)
      setContacto({ nombre: '', telefono: '', email: '', servicio: '', mensaje: '', aceptoDatos: false })
    } catch {
      // el estado de error ya lo expone crearLead.isError
    }
  }

  return (
    <div className="bg-white font-['Outfit',sans-serif]">

      {/* ═══════════════════════════════════════════════════════
          HERO — fondo azul marino oscuro con gradiente cian
          ═══════════════════════════════════════════════════════ */}
      <section
        className="relative flex items-center justify-center overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24 lg:min-h-screen lg:pt-[110px] lg:pb-[100px]"
        style={{ backgroundColor: '#001124' }}
      >
        {/* Foto de fondo: el territorio desde dron (FOTOS/DJI_…0637) */}
        <Foto
          foto={FOTOS.heroTerritorio}
          sizes="100vw"
          prioridad
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay navy: uniforme en móvil (el texto ocupa todo el ancho) y más
            denso a la izquierda en escritorio, donde va el texto */}
        <div
          className="pointer-events-none absolute inset-0 bg-[rgba(0,17,36,0.74)] lg:bg-[linear-gradient(90deg,rgba(0,17,36,0.74)_0%,rgba(0,17,36,0.62)_50%,rgba(0,17,36,0.58)_92%,rgba(0,17,36,0.35)_100%)]"
          aria-hidden="true"
        />
        {/* Grid overlay sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(180deg, rgba(0,181,197,0.06) 1.67%, transparent 1.67%), linear-gradient(90deg, rgba(0,181,197,0.06) 1.67%, transparent 1.67%)' }}
          aria-hidden="true"
        />

        <Container className="relative z-10 flex flex-col items-center justify-center gap-12 lg:flex-row lg:gap-20">
          {/* Columna texto */}
          <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
            {/* Badge */}
            <div className="reveal flex max-w-full items-center gap-2 self-start rounded-full border border-[rgba(0,181,197,0.35)] bg-[rgba(0,181,197,0.18)] px-[15px] py-[7px]">
              <div className="h-[6px] w-[6px] shrink-0 rounded-[3px] bg-[#00b5c5]" />
              <span className="text-[11px] font-medium tracking-[0.8px] text-[#6bd8de] uppercase sm:text-[12px] sm:tracking-[1.2px]">
                18 años de experiencia territorial
              </span>
            </div>

            {/* H1 */}
            <h1 className="reveal max-w-[15ch] font-extrabold text-balance text-white"
              style={{ fontSize: 'clamp(34px, 5vw, 64px)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
              Conocemos el <span className="text-[#00b5c5]">Territorio</span> para Viabilizar sus Proyectos
            </h1>

            <p className="reveal texto-lead max-w-[480px] text-[#9cbec9]">
              Empresa especializada en consultoría, gestión predial, avalúos y
              comercialización de inmuebles a nivel nacional. Confianza y
              profesionalismo desde 2006.
            </p>

            {/* CTAs */}
            <div className="reveal flex flex-col gap-3 pt-4 min-[400px]:flex-row min-[400px]:flex-wrap">
              <Link to="/inmuebles"
                className="inline-flex items-center justify-center gap-2 bg-[#00b5c5] text-[#001124] font-bold text-[14px] px-7 py-[15px] rounded-[10px] hover:bg-[#00a0b0] transition-colors duration-200">
                <Search className="w-4 h-4" aria-hidden="true" />
                Buscar Inmueble
              </Link>
              <a href="#servicios"
                className="inline-flex items-center justify-center border border-[rgba(255,255,255,0.25)] text-white font-bold text-[14px] px-7 py-[15px] rounded-[10px] hover:border-[rgba(255,255,255,0.5)] transition-colors duration-200">
                Ver Servicios
              </a>
            </div>
          </div>

          {/* Columna stats cards */}
          <div className="hidden w-full min-w-0 flex-col gap-4 md:flex lg:w-auto lg:flex-1">
            {/* 4 en fila en tablet (bajo el texto), 2x2 en escritorio (al lado) */}
            <div className="grid grid-cols-2 gap-[14px] md:grid-cols-4 lg:grid-cols-2">
              {[
                { Icon: Handshake, num: '2.717', label: 'Operaciones inmobiliarias' },
                { Icon: Calendar,  num: '18+',   label: 'Años de trayectoria' },
                { Icon: Users,     num: '50+',   label: 'Clientes satisfechos' },
                { Icon: ShieldCheck, num: 'ISO',   label: 'Certificación de calidad' },
              ].map(({ Icon, num, label }) => (
                <div key={label}
                  className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] rounded-[16px] p-[25px] flex flex-col gap-[2px]">
                  <div className="bg-[rgba(0,181,197,0.25)] rounded-[10px] w-10 h-10 flex items-center justify-center mb-3 text-white">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="font-extrabold text-[28px] text-white tracking-[-1px] leading-none">{num}</p>
                  <p className="text-[#82acba] text-[12px] font-normal">{label}</p>
                </div>
              ))}
            </div>
            {/* Banner cobertura nacional */}
            <div
              className="border border-[rgba(0,181,197,0.3)] rounded-[16px] hidden gap-5 items-center px-[29px] py-[25px] lg:flex"
              style={{ background: 'linear-gradient(135deg, rgba(0,181,197,0.2) 0%, rgba(0,181,197,0.08) 100%)' }}>
              <div className="bg-[#00b5c5] rounded-[12px] w-[52px] h-[52px] flex items-center justify-center shrink-0 text-white">
                <Map className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-[20px] text-white leading-none">Cobertura Nacional</p>
                <p className="text-[#93c1c9] text-[13px] mt-1">Proyectos en todo el territorio colombiano</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PUBLICACIONES DESTACADAS (spec 05)
          ═══════════════════════════════════════════════════════ */}
      <PublicacionesDestacadas />

      {/* ═══════════════════════════════════════════════════════
          QUIÉNES SOMOS — fondo blanco roto #f8fafd
          ═══════════════════════════════════════════════════════ */}
      <section id="quienes-somos" className="scroll-mt-16 bg-[#f8fafd] py-16 sm:py-24 md:scroll-mt-[102px]">
        <Container className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
          {/* Foto del equipo con la insignia de fundación. Visible también en
              móvil (antes era hidden lg:block): es la foto más humana del sitio.
              3:2 nativo para no cortar a nadie en los bordes. */}
          <div className="relative w-full shrink-0 overflow-hidden rounded-[20px] lg:w-[45%] lg:max-w-[560px]">
            <Foto
              foto={FOTOS.equipo}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="aspect-[3/2] h-auto w-full object-cover"
            />
            <div className="absolute right-4 bottom-4 flex items-center gap-3 rounded-[14px] bg-white px-5 py-4 shadow-[0px_8px_16px_rgba(0,17,36,0.2)] sm:right-6 sm:bottom-6">
              <p className="text-[28px] leading-none font-extrabold text-[#004b98]">2006</p>
              <p className="text-[11px] leading-[1.4] font-medium text-[#7a8187]">
                Fundación
                <br />
                de la empresa
              </p>
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="reveal self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Quiénes somos</span>
            </div>
            <h2 className="reveal titulo-seccion text-[#001124]">
              Expertos en gestión predial e inmobiliaria
            </h2>
            <p className="reveal text-[15px] leading-[1.75] text-pretty text-[#7a8187]">
              Desde 2006, <strong className="text-[#001124] font-bold">Urbanos &amp; Rurales S.A.S</strong> ha desarrollado múltiples proyectos en el
              campo de la ingeniería y el Derecho, contando con un equipo interdisciplinario de
              ingenieros, arquitectos, abogados, trabajadores sociales y economistas.
            </p>
            <p className="reveal text-[15px] leading-[1.75] text-pretty text-[#7a8187]">
              Nos hemos comprometido con el desarrollo del país y la satisfacción de nuestros
              clientes, brindando asesoría integral en consultoría, gestión predial, avalúos y
              comercialización de inmuebles.
            </p>
            {/* Quote */}
            <div className="reveal border-l-[3px] border-[#00b5c5] pl-5 py-1 my-1">
              <p className="text-[#008ec9] text-[15px] font-semibold">
                "Conocemos el Territorio para Viabilizar sus Proyectos"
              </p>
            </div>
            {/* Tags valores */}
            <div className="reveal grid grid-cols-2 gap-3 pt-2">
              {['Ética profesional', 'Atención al cliente', '18 años de experiencia', 'Profesionalismo'].map((v) => (
                <div key={v} className="flex items-center gap-[10px] bg-[#eff4f8] rounded-[10px] px-4 py-[10px]">
                  <div className="w-2 h-2 rounded-[4px] bg-[#00b5c5] shrink-0" />
                  <span className="text-[#001124] text-[13px] font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════
          VALORES — banda oscura, 4 columnas con separadores
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#001124]">
        <Container>
          <div className="grid grid-cols-2 border-r border-l border-[rgba(255,255,255,0.08)] sm:grid-cols-4">
          {[
            { Icon: Scale,   title: 'Ética',            desc: 'Actuamos con transparencia e integridad en cada proceso' },
            { Icon: Users,   title: 'Atención al Cliente', desc: 'Servicio personalizado y dedicado para cada cliente' },
            { Icon: Calendar,   title: 'Experiencia',      desc: 'Más de 18 años ejecutando proyectos a nivel nacional' },
            { Icon: ShieldCheck, title: 'Profesionalismo',  desc: 'Equipo interdisciplinario con certificación de calidad ISO' },
          ].map(({ Icon, title, desc }) => (
            <div key={title}
              className="flex flex-col items-center gap-[6px] border-[rgba(255,255,255,0.08)] border-r px-6 py-10 text-center [&:nth-child(-n+2)]:border-b [&:nth-child(2n)]:border-r-0 sm:border-b-0 sm:px-8 sm:py-12 sm:[&:nth-child(2n)]:border-r sm:[&:nth-child(4n)]:border-r-0">
              <div className="bg-[rgba(0,181,197,0.18)] rounded-[14px] w-14 h-14 flex items-center justify-center mb-2 text-white">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="font-bold text-[15px] text-white">{title}</p>
              <p className="text-[#6d97a4] text-[12px] leading-[1.5] text-pretty">{desc}</p>
            </div>
          ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SERVICIOS — grid 3 cols + tarjeta destacada azul
          ═══════════════════════════════════════════════════════ */}
      <section id="servicios" className="scroll-mt-16 bg-[#eff4f8] py-16 sm:py-24 md:scroll-mt-[102px]">
        <Container className="flex flex-col gap-10 sm:gap-14">
          {/* Header sección */}
          <div className="reveal flex flex-col gap-3">
            <div className="self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Líneas de Servicio</span>
            </div>
            <h2 className="titulo-seccion text-[#001124]">
              Lo que hacemos por su proyecto
            </h2>
          </div>

          {/* Grid servicios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICIOS.map(({ num, Icon, titulo, desc }) => (
              <div key={titulo}
                className="reveal flex flex-col gap-[11px] rounded-[20px] border border-[#d8dfe4] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,17,36,0.08)] sm:p-9">
                <span className="text-[#7a8187] text-[11px] font-semibold tracking-[1.1px]">{num}</span>
                <div className="bg-[rgba(0,75,152,0.08)] rounded-[14px] w-[52px] h-[52px] flex items-center justify-center text-[#004b98]">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-bold text-[#001124] text-[17px] mt-2">{titulo}</p>
                <p className="text-[14px] leading-[1.65] text-pretty text-[#7a8187]">{desc}</p>
                <a href="#contacto"
                  onClick={(e) => { e.preventDefault(); seleccionarServicio(titulo) }}
                  className="flex items-center gap-[6px] text-[#004b98] text-[13px] font-semibold mt-1 hover:text-[#00b5c5] transition-colors">
                  Cotizar
                  <ArrowRight className="w-[14px] h-[14px]" aria-hidden="true" />
                </a>
              </div>
            ))}

            {/* Tarjeta comercialización — destaca en azul, ocupa 2 cols */}
            <div
              className="reveal col-span-1 sm:col-span-2 border border-[#d8dfe4] rounded-[20px] overflow-hidden flex"
              style={{ background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #008ec9 100%)' }}>
              <div className="flex flex-1 flex-col gap-[11px] p-7 sm:p-10">
                <span className="text-[rgba(255,255,255,0.5)] text-[11px] font-semibold tracking-[1.1px]">05</span>
                <div className="bg-[rgba(255,255,255,0.15)] rounded-[14px] w-[52px] h-[52px] flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="titulo-sub mt-2 text-white">Comercialización de Inmuebles</p>
                <p className="max-w-[420px] text-[14px] leading-[1.65] text-pretty text-[rgba(255,255,255,0.7)]">
                  Soluciones integrales para la venta y compra de inmuebles, ofreciendo análisis
                  de rentabilidad, estrategias de marketing, escrituración y compra eficaz del predio.
                </p>
                <Link to="/inmuebles" className="flex items-center gap-[6px] text-[#6bd8de] text-[13px] font-semibold mt-1 hover:text-white transition-colors">
                  Ver portafolio de inmuebles
                  <ArrowRight className="w-[14px] h-[14px]" aria-hidden="true" />
                </Link>
              </div>
              {/* Provisional: cenital rural de palmas. Sustituir por una aérea de
                  proyecto inmobiliario urbano cuando el cliente la envíe. */}
              <div className="relative hidden flex-1 lg:block">
                <Foto
                  foto={FOTOS.comercializacion}
                  sizes="(min-width: 1280px) 400px, 33vw"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TRAYECTORIA — número grande + stats secundarios
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-24">
        <Container className="flex flex-col items-center gap-12 sm:gap-16">
          {/* Header */}
          <div className="reveal flex flex-col items-center gap-3 text-center">
            <div className="bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Trayectoria</span>
            </div>
            <h2 className="titulo-seccion text-[#001124]">
              Resultados que hablan por sí solos
            </h2>
          </div>

          {/* Número grande */}
          <div className="reveal flex flex-col items-center gap-3 text-center">
            <p className="font-extrabold text-[#004b98] leading-none"
              style={{ fontSize: 'clamp(56px, 12vw, 120px)', letterSpacing: '-0.035em' }}>1.610</p>
            <p className="texto-lead text-[#7a8187]">Operaciones inmobiliarias en 18 años</p>
          </div>

          {/* Stats secundarios */}
          <div className="reveal grid w-full max-w-[800px] grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[#e0e5e9]">
            {[
              { num: '19+', label: ['Departamentos', 'con proyectos', 'activos'] },
              { num: '10+', label: ['Entidades', 'públicas', 'atendidas'] },
              { num: '31+', label: ['Especialistas en', 'el equipo'] },
              { num: '15+', label: ['Años de', 'experiencia', 'nacional'] },
            ].map(({ num, label }) => (
              <div key={num} className="flex flex-col items-center gap-2 px-3 text-center sm:px-5">
                <p className="text-[34px] leading-none font-extrabold tracking-[-0.04em] text-[#001124] sm:text-[48px]">{num}</p>
                <p className="text-[#7a8187] text-[13px] leading-[1.5]">{label.map((l, j) => <span key={j}>{l}{j < label.length - 1 ? <br/> : null}</span>)}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CLIENTES — carrusel compartido con Quiénes Somos (logo + nombre)
          ═══════════════════════════════════════════════════════ */}
      <ClientesCarrusel
        titulo="Algunos de nuestros clientes"
        subtitulo="Instituciones y entidades de alto nivel que confían en nuestra experiencia y calidad de servicio."
      />

      {/* ═══════════════════════════════════════════════════════
          CERTIFICACIONES — banda oscura (spec 08: plantilla lista para
          completar con las certificaciones reales del cliente; nombres y
          párrafos de abajo son contenido de referencia a editar).
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#001124] py-16 sm:py-24">
        <Container className="flex flex-col items-center gap-10 text-center md:flex-row md:gap-16 md:text-left">
          {/* Ícono cert */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="bg-white rounded-[20px] w-[96px] h-[96px] sm:w-[120px] sm:h-[120px] flex items-center justify-center text-[#004b98] shadow-[0px_12px_20px_rgba(0,0,0,0.3)]">
              <Award className="w-12 h-12 sm:w-14 sm:h-14" aria-label="Certificación" />
            </div>
            <p className="text-[#7aa7b0] text-[12px] font-semibold tracking-[0.96px] uppercase text-center">Certificaciones</p>
          </div>
          {/* Texto */}
          <div className="flex-1 flex flex-col items-center gap-4 min-w-0 md:items-start">
            <h3 className="reveal titulo-sub text-white">
              Certificaciones y respaldos
            </h3>
            <p className="reveal max-w-[580px] text-[14px] leading-[1.7] text-pretty text-[#7ca6b4] sm:text-[15px]">
              Contamos con certificaciones que respaldan nuestros procesos de consultoría
              y gestión predial. Esta sección es una plantilla: reemplaza el texto y
              los sellos de abajo con las certificaciones reales de la empresa cuando
              estén listas.
            </p>
            <div className="reveal flex flex-wrap justify-center gap-3 md:justify-start">
              {CERTIFICACIONES_PLANTILLA.map((tag) => (
                <span key={tag}
                  className="border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] text-[#6bd8de] text-[12px] font-semibold tracking-[0.6px] px-[17px] py-2 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CONTACTO — form + datos + mapa placeholder
          ═══════════════════════════════════════════════════════ */}
      <section id="contacto" className="scroll-mt-16 bg-white py-16 sm:py-24 md:scroll-mt-[102px]">
        <Container className="flex flex-col gap-10 sm:gap-14">
          {/* Header */}
          <div className="reveal flex flex-col gap-3">
            <div className="self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Contacto</span>
            </div>
            <h2 className="titulo-seccion text-[#001124]">
              Hablemos de su proyecto
            </h2>
          </div>

          <div className="flex flex-col gap-12 lg:flex-row lg:gap-20 lg:items-start">
            {/* Datos de contacto + mapa */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              {[
                { Icon: MapPin, label: 'Dirección', lines: ['Av Kr 15 #98-42 Oficina M02', 'Edificio Office Point · Barrio Chicó, Bogotá D.C.'] },
                { Icon: Phone,  label: 'Teléfonos', lines: [site.contacto.telefono, site.contacto.whatsappVisible] },
                { Icon: Mail,   label: 'Correo electrónico', lines: [site.contacto.email] },
                { Icon: Clock,  label: 'Horario de atención', lines: ['Lunes a Viernes: 8:00 am – 6:00 pm', 'Sábados: 9:00 am – 1:00 pm'] },
              ].map(({ Icon, label, lines }) => (
                <div key={label} className="reveal flex gap-[14px] items-start">
                  <div className="bg-[rgba(0,75,152,0.08)] rounded-[10px] w-10 h-10 flex items-center justify-center shrink-0 mt-[2px] text-[#004b98]">
                    <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[#001124] text-[13px] font-semibold">{label}</p>
                    {lines.map((l) => <p key={l} className="text-[#7a8187] text-[14px] leading-[1.5]">{l}</p>)}
                  </div>
                </div>
              ))}
              {/* Mapa placeholder */}
              <div
                className="reveal bg-[#e0e5e9] rounded-[16px] flex items-center justify-center px-5 mt-2"
                style={{ aspectRatio: '560/315' }}>
                <p className="text-[#7a8187] text-[12px] text-center">[ mapa — Edificio Office Point, Chicó, Bogotá ]</p>
              </div>
            </div>

            {/* Formulario */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              <p className="titulo-sub text-[#001124]">Envíenos un mensaje</p>
              <form className="flex flex-col gap-[14px]" onSubmit={handleEnviarContacto}>
                {/* Honeypot anti-spam: oculto para humanos, los bots sí lo llenan */}
                <input
                  type="text"
                  name="sitio_web"
                  value={sitio}
                  onChange={(e) => setSitio(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-[14px] sm:flex-row">
                  <div className="flex-1 flex flex-col gap-[6px]">
                    <label htmlFor="nombre" className="text-[#41596a] text-[12px] font-semibold tracking-[0.6px] uppercase">Nombre completo</label>
                    <input id="nombre" type="text" placeholder="Su nombre"
                      value={contacto.nombre}
                      onChange={(e) => actualizarContacto('nombre', e.target.value)}
                      className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] px-[17px] py-[13px] text-[14px] text-[#0d1c27] placeholder:text-[#757575] outline-none focus:border-[#004b98] focus:bg-white transition-colors" />
                  </div>
                  <div className="flex-1 flex flex-col gap-[6px]">
                    <label htmlFor="telefono" className="text-[#41596a] text-[12px] font-semibold tracking-[0.6px] uppercase">Teléfono</label>
                    <input id="telefono" type="tel" placeholder="+57 300 000 0000"
                      value={contacto.telefono}
                      onChange={(e) => actualizarContacto('telefono', e.target.value)}
                      className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] px-[17px] py-[13px] text-[14px] text-[#0d1c27] placeholder:text-[#757575] outline-none focus:border-[#004b98] focus:bg-white transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="email" className="text-[#41596a] text-[12px] font-semibold tracking-[0.6px] uppercase">Correo electrónico</label>
                  <input id="email" type="email" placeholder="correo@empresa.com"
                    value={contacto.email}
                    onChange={(e) => actualizarContacto('email', e.target.value)}
                    className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] px-[17px] py-[13px] text-[14px] text-[#0d1c27] placeholder:text-[#757575] outline-none focus:border-[#004b98] focus:bg-white transition-colors" />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="servicio" className="text-[#41596a] text-[12px] font-semibold tracking-[0.6px] uppercase">Servicio de interés</label>
                  <div className="relative">
                  <select id="servicio"
                    value={contacto.servicio}
                    onChange={(e) => actualizarContacto('servicio', e.target.value)}
                    className="w-full bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] pl-[17px] pr-10 py-[14px] text-[14px] text-[#0d1c27] outline-none focus:border-[#004b98] focus:bg-white transition-colors appearance-none cursor-pointer">
                    <option value="">Seleccione un servicio...</option>
                    <option>Consultoría y Asesoría Predial</option>
                    <option>Gestión Predial Integral</option>
                    <option>Avalúos</option>
                    <option>Topografía</option>
                    <option>Comercialización de Inmuebles</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#7a8187]"
                    aria-hidden="true"
                  />
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="mensaje" className="text-[#41596a] text-[12px] font-semibold tracking-[0.6px] uppercase">Mensaje</label>
                  <textarea id="mensaje" rows={4} placeholder="Cuéntenos sobre su proyecto..."
                    value={contacto.mensaje}
                    onChange={(e) => actualizarContacto('mensaje', e.target.value)}
                    className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] px-[17px] py-[13px] text-[14px] text-[#0d1c27] placeholder:text-[#757575] outline-none focus:border-[#004b98] focus:bg-white transition-colors resize-none" />
                </div>
                <label className="flex items-start gap-2 text-[12px] text-[#41596a] leading-[1.5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contacto.aceptoDatos}
                    onChange={(e) => actualizarContacto('aceptoDatos', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#004b98] cursor-pointer shrink-0"
                  />
                  Acepto el tratamiento de mis datos personales conforme a la política de privacidad.
                </label>
                {errorValidacion && (
                  <p className="text-[13px] font-semibold text-[#c0392b] bg-[rgba(192,57,43,0.08)] rounded-[10px] px-4 py-3">
                    {errorValidacion}
                  </p>
                )}
                {crearLead.isError && (
                  <p className="text-[13px] font-semibold text-[#c0392b] bg-[rgba(192,57,43,0.08)] rounded-[10px] px-4 py-3">
                    No pudimos enviar tu mensaje. Intenta nuevamente en unos minutos.
                  </p>
                )}
                {envioExitoso && (
                  <p className="text-[13px] font-semibold text-[#0a8a3f] bg-[rgba(10,138,63,0.08)] rounded-[10px] px-4 py-3">
                    ¡Gracias! Recibimos tu mensaje y te contactaremos pronto.
                  </p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" disabled={crearLead.isPending}
                    className="flex-1 bg-[#004b98] text-white font-bold text-[14px] py-[14px] rounded-[10px] hover:bg-[#003b7a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200">
                    {crearLead.isPending ? 'Enviando…' : 'Enviar mensaje'}
                  </button>
                  <button type="button"
                    className="border border-[#004b98] text-[#004b98] font-semibold text-[13px] px-[21px] py-[15px] rounded-[10px] hover:bg-[rgba(0,75,152,0.05)] transition-colors duration-200">
                    Generar PQR
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </section>

      {/* El FAB de redes lo pinta PublicLayout para todas las rutas. */}

    </div>
  )
}
