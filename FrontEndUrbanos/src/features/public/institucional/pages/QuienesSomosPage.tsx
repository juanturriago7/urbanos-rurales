import { FormularioTrabajaConNosotros } from '@/features/public/institucional/components/FormularioTrabajaConNosotros'

/**
 * Página Quiénes somos — spec 07.
 *
 * Bloques: presentación + Misión + Visión + Trabaja con nosotros (form al
 * final). El copy de Misión/Visión es placeholder/plantilla listo para
 * reemplazar con el contenido real de la empresa.
 */
export function QuienesSomosPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#001124] py-24 px-12">
        <div className="mx-auto max-w-[1100px]">
          <span className="inline-block rounded-full bg-[rgba(0,181,197,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#00b5c5]">
              Quiénes somos
            </span>
          </span>
          <h1 className="mt-4 text-[48px] font-extrabold leading-[1.05] tracking-[-1px] text-white">
            Una empresa con visión,<br />ejecutada con oficio.
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-[1.65] text-[#8bb6c4]">
            Somos una firma de consultoría y gestión predial con más de una década
            acompañando al sector público y privado en Colombia.
          </p>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="bg-[#eff4f8] px-12 py-20">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.5px] text-[#001124]">
              Quiénes somos
            </h2>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#44403c]">
              [Texto institucional: descripción de la empresa, trayectoria,
              áreas de práctica, equipo. Reemplazar con el copy definitivo del cliente.]
            </p>
          </div>
          <div className="flex items-center justify-center">
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
        <div className="mx-auto max-w-[900px] text-center">
          <span className="inline-block rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
              Misión
            </span>
          </span>
          <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-[#001124]">
            Nuestra misión
          </h2>
          <p className="mt-4 text-[18px] leading-[1.6] text-[#44403c]">
            [Plantilla: nuestra misión es … completar con el enunciado
            definitivo de la empresa. Texto corto, una o dos frases.]
          </p>
        </div>
      </section>

      {/* Visión */}
      <section className="bg-[#001124] px-12 py-20">
        <div className="mx-auto max-w-[900px] text-center">
          <span className="inline-block rounded-full bg-[rgba(0,181,197,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#00b5c5]">
              Visión
            </span>
          </span>
          <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-white">
            Nuestra visión
          </h2>
          <p className="mt-4 text-[18px] leading-[1.6] text-[#8bb6c4]">
            [Plantilla: queremos ser … completar con el enunciado
            definitivo. Proyectar a 5-10 años, sector y aporte esperado.]
          </p>
        </div>
      </section>

      {/* Trabaja con nosotros */}
      <section id="trabaja-con-nosotros" className="bg-[#eff4f8] px-12 py-20">
        <div className="mx-auto max-w-[720px]">
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
          <div className="mt-8 rounded-[20px] border border-[#d8dfe4] bg-white p-8">
            <FormularioTrabajaConNosotros />
          </div>
        </div>
      </section>
    </div>
  )
}
