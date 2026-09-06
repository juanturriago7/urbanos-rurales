import { FormularioTrabajaConNosotros } from '@/features/public/institucional/components/FormularioTrabajaConNosotros'
import { useScrollReveal } from '@/shared/hooks/useScrollReveal'

/**
 * Página Quiénes somos — spec 07.
 *
 * Bloques: presentación + Misión + Visión + Política Integral +
 * No Aplicabilidad de la Norma + Objetivos SIG + Trabaja con nosotros.
 * Cada bloque entra con fade/slide o fade/scale al hacer scroll (ver
 * useScrollReveal, mismo mecanismo que ya usa la home).
 */
export function QuienesSomosPage() {
  useScrollReveal()

  const objetivosSig = [
    'Dar cumplimiento a las disposiciones legales vigentes que apliquen al Sistema Integrado de Gestión - SIG.',
    'Identificar los peligros y aspectos ambientales en cada una de las actividades con el fin de minimizar los riesgos ocupacionales, accidentes y enfermedades laborales, al igual que los impactos ambientales negativos relacionados con las actividades desarrolladas por la empresa.',
    'Vigilar y monitorear el estado de la salud de los trabajadores directos y/o indirectos, desarrollando actividades de promoción y prevención de posibles enfermedades laborales.',
    'Promover y motivar al personal en la prevención de riesgos e impactos en todas sus actividades, mediante la comunicación y participación del programa de capacitación.',
    'Fomentar y garantizar las condiciones de seguridad, salud e integridad física, mental y social del personal durante el desarrollo de las labores.',
    'Divulgar a todos los trabajadores directos y/o indirectos las políticas, objetivos, metas y directrices internas y de los clientes en el SIG.',
    'Mantener el mejoramiento continuo del sistema a través del ciclo PHVA.',
    'Conseguir la satisfacción de los clientes.',
  ]

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#001124] py-24 px-12">
        <div className="mx-auto max-w-[1100px]">
          <span className="reveal inline-block rounded-full bg-[rgba(0,181,197,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#00b5c5]">
              Quiénes somos
            </span>
          </span>
          <h1 className="reveal mt-4 text-[48px] font-extrabold leading-[1.05] tracking-[-1px] text-white">
            Una empresa con visión,<br />ejecutada con oficio.
          </h1>
          <p className="reveal mt-4 max-w-[640px] text-[16px] leading-[1.65] text-[#8bb6c4]">
            Somos una firma de consultoría y gestión predial con más de una década
            acompañando al sector público y privado en Colombia.
          </p>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="bg-[#eff4f8] px-12 py-20">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="reveal">
            <h2 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.5px] text-[#001124]">
              Quiénes somos
            </h2>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#44403c]">
              Somos una compañía especializada en consultorías, asesorías y desarrollo en proyectos
              de gestión predial integral y otros servicios, con el compromiso de satisfacer a
              nuestros clientes del sector público y privado cumpliendo los compromisos contractuales
              convenidos. Desarrollamos nuestra actividad en el territorio nacional, ofreciendo
              productos y servicios, buscando mejorar los procesos para el beneficio de nuestros
              colaboradores, proveedores y partes interesadas.
            </p>
          </div>
          <div className="reveal-scale flex items-center justify-center">
            <div
              className="aspect-[4/3] w-full rounded-[20px]"
              style={{
                background: 'linear-gradient(135deg, #004b98 0%, #0071b2 60%, #00b5c5 100%)',
              }}
            >
              <div className="flex h-full items-center justify-center text-[rgba(255,255,255,0.5)] text-[12px]">
                [Imagen institucional]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión */}
      <section className="px-12 py-20">
        <div className="reveal mx-auto max-w-[900px] text-center">
          <span className="inline-block rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
              Misión
            </span>
          </span>
          <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-[#001124]">
            Nuestra misión
          </h2>
          <p className="mt-4 text-[18px] leading-[1.6] text-[#44403c]">
            Somos una compañía especializada en consultorías, asesorías y desarrollo en proyectos
            de gestión predial integral y otros servicios, con el compromiso de satisfacer a
            nuestros clientes del sector público y privado cumpliendo los compromisos contractuales
            convenidos. Desarrollamos nuestra actividad en el territorio nacional, ofreciendo
            productos y servicios, buscando mejorar los procesos para el beneficio de nuestros
            colaboradores, proveedores y partes interesadas.
          </p>
        </div>
      </section>

      {/* Visión */}
      <section className="bg-[#001124] px-12 py-20">
        <div className="reveal mx-auto max-w-[900px] text-center">
          <span className="inline-block rounded-full bg-[rgba(0,181,197,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#00b5c5]">
              Visión
            </span>
          </span>
          <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-white">
            Nuestra visión
          </h2>
          <p className="mt-4 text-[18px] leading-[1.6] text-[#8bb6c4]">
            Para el 2026 seremos una de las empresas líderes en consultoría y asesorías en gestión
            predial y servicios inmobiliarios, implementando los más altos estándares de calidad y
            confiabilidad, a través de la efectividad de los diferentes procesos para satisfacer a
            las partes interesadas.
          </p>
        </div>
      </section>

      {/* No Aplicabilidad de la Norma */}
      <section className="px-12 py-20">
        <div className="mx-auto max-w-[900px]">
          <div className="reveal">
            <span className="inline-block rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
                No Aplicabilidad de la Norma
              </span>
            </span>
            <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-[#001124]">
              Exclusiones normativas
            </h2>
          </div>

          <div className="mt-8 space-y-6">
            {/* ISO 9001 */}
            <div
              className="reveal-scale rounded-[16px] border border-[#d8dfe4] bg-[#f8fafc] p-6"
              style={{ transitionDelay: '80ms' }}
            >
              <p className="text-[13px] font-semibold uppercase tracking-[1px] text-[#004b98]">
                8.3 Diseño y Desarrollo — ISO 9001:2015
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-[#44403c]">
                No aplica, ya que no se realizan actividades de diseño y desarrollo de productos
                puesto que los servicios de consultoría, gestión predial integral y elaboración
                de insumos técnicos se rigen por las disposiciones normativas que no implican
                ninguna transformación legislativa por parte de la compañía.
              </p>
            </div>

            {/* ISO 14001 */}
            <div
              className="reveal-scale rounded-[16px] border border-[#d8dfe4] bg-[#f8fafc] p-6"
              style={{ transitionDelay: '160ms' }}
            >
              <p className="text-[13px] font-semibold uppercase tracking-[1px] text-[#004b98]">
                8.1 Planificación y Control Operacional — ISO 14001:2015
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-[#44403c]">
                En cuanto a lo ambiental tampoco se modifica diseño y desarrollo ya que se basa
                en los requerimientos normativos existentes y se acatan los requerimientos del
                cliente sin realizar transformación alguna por nuestra parte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Objetivos SIG */}
      <section className="bg-[#001124] px-12 py-20">
        <div className="mx-auto max-w-[900px]">
          <div className="reveal">
            <span className="inline-block rounded-full bg-[rgba(0,181,197,0.08)] px-3 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#00b5c5]">
                Objetivos SIG
              </span>
            </span>
            <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-white">
              Sistema Integrado de Gestión
            </h2>
          </div>
          <ul className="mt-8 space-y-4">
            {objetivosSig.map((objetivo, index) => (
              <li
                key={index}
                className="reveal flex gap-4"
                style={{ transitionDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00b5c5] text-[11px] font-bold text-[#001124]">
                  {index + 1}
                </span>
                <p className="text-[15px] leading-[1.7] text-[#8bb6c4]">{objetivo}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Trabaja con nosotros */}
      <section id="trabaja-con-nosotros" className="bg-[#eff4f8] px-12 py-20">
        <div className="mx-auto max-w-[720px]">
          <div className="reveal">
            <span className="inline-block rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
                Trabaja con nosotros
              </span>
            </span>
            <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-[#001124]">
              ¿Te gustaría hacer parte del equipo?
            </h2>
            <p className="mt-3 text-[16px] leading-[1.65] text-[#7a8187]">
              Envíanos tu hoja de vida. Revisamos cada postulación y te contactamos
              si hay un match con alguna de nuestras vacantes.
            </p>
          </div>
          <div className="reveal-scale mt-8 rounded-[20px] border border-[#d8dfe4] bg-white p-8">
            <FormularioTrabajaConNosotros />
          </div>
        </div>
      </section>
    </div>
  )
}
