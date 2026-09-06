import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
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
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PublicacionesDestacadas } from '@/features/public/properties/components/PublicacionesDestacadas'
import { useCrearLead } from '@/features/public/contacto/hooks/useCrearLead'
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon'
import { site } from '@/shared/config/site'

/* ── Reveal on scroll ─────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.08 },
    )
    document.querySelectorAll('.reveal').forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
}

/* ── Marquee clientes ─────────────────────────────────────────── */
const CLIENTES = [
  'Compensar',
  'Ministerio de Salud y Protección Social',
  'Agencia Nacional de Infraestructura · ANI',
  'Gobernación de Cundinamarca',
  'Ministerio de Vivienda',
  'INVÍAS',
  'Fondo Nacional del Ahorro',
  'Secretaría de Educación Distrital',
]

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
  useReveal()
  const marqueeRef = useRef<HTMLDivElement>(null)
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

  /* Auto-scroll marquee */
  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    let frame: number
    let pos = 0
    const speed = 0.5
    const step = () => {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.style.transform = `translateX(-${pos}px)`
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="bg-white font-['Outfit',sans-serif]">

      {/* ═══════════════════════════════════════════════════════
          HERO — fondo azul marino oscuro con gradiente cian
          ═══════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen overflow-hidden flex items-center justify-center pt-[110px] pb-[100px] px-12"
        style={{ backgroundColor: '#001124' }}
      >
        {/* Gradiente cian diagonal */}
        <div
          className="absolute top-[-63px] right-[-192px] w-[1248px] h-[1386px] opacity-90 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #0071b2 0%, #008ec9 40%, #00b5c5 100%)',
                   maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 40%, transparent 70%)' }}
          aria-hidden="true"
        />
        {/* Grid overlay sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(180deg, rgba(0,181,197,0.06) 1.67%, transparent 1.67%), linear-gradient(90deg, rgba(0,181,197,0.06) 1.67%, transparent 1.67%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex gap-20 items-center justify-center w-full max-w-[1200px] mx-auto">
          {/* Columna texto */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Badge */}
            <div className="reveal flex items-center gap-2 self-start px-[15px] py-[7px] rounded-full border border-[rgba(0,181,197,0.35)] bg-[rgba(0,181,197,0.18)]">
              <div className="w-[6px] h-[6px] rounded-[3px] bg-[#00b5c5]" />
              <span className="text-[#6bd8de] text-[12px] font-medium tracking-[1.2px] uppercase whitespace-nowrap">
                18 años de experiencia territorial
              </span>
            </div>

            {/* H1 */}
            <h1 className="reveal font-extrabold text-white leading-[1.08] tracking-[-1.5px]"
              style={{ fontSize: 'clamp(42px, 5vw, 64px)' }}>
              Conocemos el<br />
              <span className="text-[#00b5c5]">Territorio</span>{' '}para<br />
              Viabilizar sus<br />
              Proyectos
            </h1>

            <p className="reveal text-[#9cbec9] text-[17px] font-normal leading-[1.65] max-w-[480px]">
              Empresa especializada en consultoría, gestión predial, avalúos y
              comercialización de inmuebles a nivel nacional. Confianza y
              profesionalismo desde 2006.
            </p>

            {/* CTAs */}
            <div className="reveal flex flex-wrap gap-3 pt-4">
              <Link to="/inmuebles"
                className="inline-flex items-center gap-2 bg-[#00b5c5] text-[#001124] font-bold text-[14px] px-7 py-[15px] rounded-[10px] hover:bg-[#00a0b0] transition-colors duration-200">
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
          <div className="flex-1 min-w-0 flex-col gap-4 hidden lg:flex">
            {/* 2x2 grid de stats */}
            <div className="grid grid-cols-2 gap-[14px]">
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
              className="border border-[rgba(0,181,197,0.3)] rounded-[16px] flex gap-5 items-center px-[29px] py-[25px]"
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PUBLICACIONES DESTACADAS (spec 05)
          ═══════════════════════════════════════════════════════ */}
      <PublicacionesDestacadas />

      {/* ═══════════════════════════════════════════════════════
          QUIÉNES SOMOS — fondo blanco roto #f8fafd
          ═══════════════════════════════════════════════════════ */}
      <section id="quienes-somos" className="bg-[#f8fafd] py-[100px] px-12">
        <div className="max-w-[1200px] mx-auto flex gap-20 items-center">
          {/* Imagen placeholder */}
          <div className="hidden lg:block shrink-0 rounded-[20px] overflow-hidden"
            style={{ width: '560px', aspectRatio: '560/420', background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)' }}>
            <div className="w-full h-full flex items-end p-6">
              <div className="ml-auto bg-white rounded-[14px] shadow-[0px_8px_16px_rgba(0,17,36,0.2)] flex gap-3 items-center px-5 py-4">
                <p className="font-extrabold text-[#004b98] text-[28px] leading-none">2006</p>
                <div>
                  <p className="text-[#7a8187] text-[11px] font-medium leading-[1.4]">Fundación<br/>de la empresa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="reveal self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Quiénes somos</span>
            </div>
            <h2 className="reveal font-extrabold text-[#001124] text-[42px] leading-[1.1] tracking-[-0.8px]">
              Expertos en gestión<br />predial e inmobiliaria
            </h2>
            <p className="reveal text-[#7a8187] text-[15px] leading-[1.75]">
              Desde 2006, <strong className="text-[#001124] font-bold">Urbanos &amp; Rurales S.A.S</strong> ha desarrollado múltiples proyectos en el
              campo de la ingeniería y el Derecho, contando con un equipo interdisciplinario de
              ingenieros, arquitectos, abogados, trabajadores sociales y economistas.
            </p>
            <p className="reveal text-[#7a8187] text-[15px] leading-[1.75]">
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          VALORES — banda oscura, 4 columnas con separadores
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#001124]">
        <div className="max-w-[1200px] mx-auto border-l border-[rgba(255,255,255,0.08)] border-r grid grid-cols-2 sm:grid-cols-4">
          {[
            { Icon: Scale,   title: 'Ética',            desc: 'Actuamos con transparencia e integridad en cada proceso' },
            { Icon: Users,   title: 'Atención al Cliente', desc: 'Servicio personalizado y dedicado para cada cliente' },
            { Icon: Calendar,   title: 'Experiencia',      desc: 'Más de 18 años ejecutando proyectos a nivel nacional' },
            { Icon: ShieldCheck, title: 'Profesionalismo',  desc: 'Equipo interdisciplinario con certificación de calidad ISO' },
          ].map(({ Icon, title, desc }, i) => (
            <div key={title}
              className={`flex flex-col items-center gap-[6px] py-12 px-8 text-center${i < 3 ? ' border-r border-[rgba(255,255,255,0.08)]' : ''}`}>
              <div className="bg-[rgba(0,181,197,0.18)] rounded-[14px] w-14 h-14 flex items-center justify-center mb-2 text-white">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="font-bold text-[15px] text-white">{title}</p>
              <p className="text-[#6d97a4] text-[12px] leading-[1.5]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SERVICIOS — grid 3 cols + tarjeta destacada azul
          ═══════════════════════════════════════════════════════ */}
      <section id="servicios" className="bg-[#eff4f8] py-[100px] px-12">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-14">
          {/* Header sección */}
          <div className="reveal flex flex-col gap-3">
            <div className="self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Líneas de Servicio</span>
            </div>
            <h2 className="font-extrabold text-[#001124] text-[42px] leading-[1.1] tracking-[-0.8px]">
              Lo que hacemos<br/>por su proyecto
            </h2>
          </div>

          {/* Grid servicios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICIOS.map(({ num, Icon, titulo, desc }) => (
              <div key={titulo}
                className="reveal bg-white border border-[#d8dfe4] rounded-[20px] p-[37px] flex flex-col gap-[11px] hover:shadow-[0_8px_32px_rgba(0,17,36,0.08)] hover:-translate-y-1 transition-all duration-300">
                <span className="text-[#7a8187] text-[11px] font-semibold tracking-[1.1px]">{num}</span>
                <div className="bg-[rgba(0,75,152,0.08)] rounded-[14px] w-[52px] h-[52px] flex items-center justify-center text-[#004b98]">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-bold text-[#001124] text-[17px] mt-2">{titulo}</p>
                <p className="text-[#7a8187] text-[14px] leading-[1.65]">{desc}</p>
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
              <div className="flex-1 p-10 flex flex-col gap-[11px]">
                <span className="text-[rgba(255,255,255,0.5)] text-[11px] font-semibold tracking-[1.1px]">05</span>
                <div className="bg-[rgba(255,255,255,0.15)] rounded-[14px] w-[52px] h-[52px] flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-bold text-white text-[22px] mt-2">Comercialización de Inmuebles</p>
                <p className="text-[rgba(255,255,255,0.7)] text-[14px] leading-[1.65] max-w-[420px]">
                  Soluciones integrales para la venta y compra de inmuebles, ofreciendo análisis
                  de rentabilidad, estrategias de marketing, escrituración y compra eficaz del predio.
                </p>
                <Link to="/inmuebles" className="flex items-center gap-[6px] text-[#6bd8de] text-[13px] font-semibold mt-1 hover:text-white transition-colors">
                  Ver portafolio de inmuebles
                  <ArrowRight className="w-[14px] h-[14px]" aria-hidden="true" />
                </Link>
              </div>
              <div className="flex-1 bg-[rgba(39,234,234,0.12)] hidden lg:flex items-center justify-center rounded-r-[20px]">
                <p className="text-[rgba(255,255,255,0.3)] text-[12px] italic text-center px-5">[ fotografía aérea de proyecto inmobiliario ]</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TRAYECTORIA — número grande + stats secundarios
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-white py-[100px] px-12">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-16 items-center">
          {/* Header */}
          <div className="reveal flex flex-col items-center gap-3 text-center">
            <div className="bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Trayectoria</span>
            </div>
            <h2 className="font-extrabold text-[#001124] text-[42px] leading-[1.1] tracking-[-0.8px]">
              Resultados que hablan<br/>por sí solos
            </h2>
          </div>

          {/* Número grande */}
          <div className="reveal flex flex-col items-center gap-3 text-center">
            <p className="font-extrabold text-[#004b98] leading-none tracking-[-4px]"
              style={{ fontSize: 'clamp(80px, 12vw, 120px)' }}>1.610</p>
            <p className="text-[#7a8187] text-[18px] tracking-[0.36px]">Operaciones inmobiliarias en 18 años</p>
          </div>

          {/* Stats secundarios */}
          <div className="reveal flex flex-wrap items-center justify-center gap-0 w-full max-w-[800px]">
            {[
              { num: '19+', label: ['Departamentos', 'con proyectos', 'activos'] },
              { num: '10+', label: ['Entidades', 'públicas', 'atendidas'] },
              { num: '31+', label: ['Especialistas en', 'el equipo'] },
              { num: '15+', label: ['Años de', 'experiencia', 'nacional'] },
            ].map(({ num, label }, i) => (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-5 text-center">
                  <p className="font-extrabold text-[#001124] text-[48px] leading-none tracking-[-2px]">{num}</p>
                  <p className="text-[#7a8187] text-[13px] leading-[1.5]">{label.map((l, j) => <span key={j}>{l}{j < label.length - 1 ? <br/> : null}</span>)}</p>
                </div>
                {i < 3 && <div className="w-px h-14 bg-[#e0e5e9] shrink-0 mx-2 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CLIENTES — marquee infinito
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#eff4f8] py-[100px] px-12">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-14">
          {/* Header */}
          <div className="reveal flex flex-col items-center gap-3 text-center">
            <div className="bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Nuestros Clientes</span>
            </div>
            <h2 className="font-extrabold text-[#001124] text-[42px] leading-[1.1] tracking-[-0.8px]">
              Algunos de nuestros clientes
            </h2>
            <p className="text-[#7a8187] text-[16px] leading-[1.7] max-w-[540px]">
              Instituciones y entidades de alto nivel que confían en nuestra experiencia y calidad de servicio.
            </p>
          </div>

          {/* Marquee */}
          <div className="relative overflow-hidden h-[87px]">
            <div ref={marqueeRef} className="flex gap-5 items-stretch absolute left-0 top-0">
              {[...CLIENTES, ...CLIENTES].map((cliente, i) => (
                <div key={i}
                  className="bg-white border border-[#d8dfe4] rounded-[14px] flex items-center justify-center px-9 py-6 min-w-[180px] shrink-0">
                  <p className="font-bold text-[#004b98] text-[14px] text-center tracking-[0.28px] leading-[1.3]">{cliente}</p>
                </div>
              ))}
            </div>
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-[120px] bg-gradient-to-r from-[#eff4f8] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-[120px] bg-gradient-to-l from-[#eff4f8] to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CERTIFICACIONES — banda oscura (spec 08: plantilla lista para
          completar con las certificaciones reales del cliente; nombres y
          párrafos de abajo son contenido de referencia a editar).
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#001124] py-20 px-12">
        <div className="max-w-[1200px] mx-auto flex gap-16 items-center">
          {/* Ícono cert */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="bg-white rounded-[20px] w-[120px] h-[120px] flex items-center justify-center text-[#004b98] shadow-[0px_12px_20px_rgba(0,0,0,0.3)]">
              <Award className="w-14 h-14" aria-label="Certificación" />
            </div>
            <p className="text-[#7aa7b0] text-[12px] font-semibold tracking-[0.96px] uppercase text-center">Certificaciones</p>
          </div>
          {/* Texto */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <h3 className="reveal font-bold text-white text-[26px] leading-tight">
              Certificaciones y respaldos
            </h3>
            <p className="reveal text-[#7ca6b4] text-[15px] leading-[1.7] max-w-[580px]">
              Contamos con certificaciones que respaldan nuestros procesos de consultoría
              y gestión predial. Esta sección es una plantilla: reemplaza el texto y
              los sellos de abajo con las certificaciones reales de la empresa cuando
              estén listas.
            </p>
            <div className="reveal flex flex-wrap gap-3">
              {CERTIFICACIONES_PLANTILLA.map((tag) => (
                <span key={tag}
                  className="border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] text-[#6bd8de] text-[12px] font-semibold tracking-[0.6px] px-[17px] py-2 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CONTACTO — form + datos + mapa placeholder
          ═══════════════════════════════════════════════════════ */}
      <section id="contacto" className="bg-white py-[100px] px-12">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-14">
          {/* Header */}
          <div className="reveal flex flex-col gap-3">
            <div className="self-start bg-[rgba(0,75,152,0.08)] px-[14px] py-[5px] rounded-full">
              <span className="text-[#004b98] text-[11px] font-semibold tracking-[1.32px] uppercase">Contacto</span>
            </div>
            <h2 className="font-extrabold text-[#001124] text-[42px] leading-[1.1] tracking-[-0.8px]">
              Hablemos de<br/>su proyecto
            </h2>
          </div>

          <div className="flex gap-20 items-start">
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
              <p className="font-bold text-[#001124] text-[22px]">Envíenos un mensaje</p>
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
                <div className="flex gap-[14px]">
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
                  <select id="servicio"
                    value={contacto.servicio}
                    onChange={(e) => actualizarContacto('servicio', e.target.value)}
                    className="bg-[#eff4f8] border border-[#d2d8dd] rounded-[10px] px-[17px] py-[14px] text-[14px] text-[#0d1c27] outline-none focus:border-[#004b98] focus:bg-white transition-colors appearance-none cursor-pointer">
                    <option value="">Seleccione un servicio...</option>
                    <option>Consultoría y Asesoría Predial</option>
                    <option>Gestión Predial Integral</option>
                    <option>Avalúos</option>
                    <option>Topografía</option>
                    <option>Comercialización de Inmuebles</option>
                  </select>
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
                <div className="flex gap-3">
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
        </div>
      </section>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${site.contacto.whatsapp}`}
        target="_blank" rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-7 z-50 w-[52px] h-[52px] bg-[#25d366] rounded-[26px] flex items-center justify-center text-white shadow-[0px_4px_10px_rgba(37,211,102,0.5)] hover:scale-110 transition-transform duration-200">
        <WhatsAppIcon className="w-[26px] h-[26px]" />
      </a>

    </div>
  )
}
