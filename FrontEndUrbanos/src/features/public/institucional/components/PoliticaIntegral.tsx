const PILARES = [
  {
    titulo: 'Seguridad y Salud en el Trabajo',
    descripcion:
      'Promovemos la prevención de riesgos laborales protegiendo a nuestros colaboradores de accidentes y enfermedades profesionales.',
  },
  {
    titulo: 'Responsabilidad Ambiental',
    descripcion:
      'Prevenimos la contaminación ambiental y el impacto socioambiental, garantizando prácticas sostenibles en todas nuestras operaciones.',
  },
  {
    titulo: 'Cumplimiento Legal',
    descripcion:
      'Garantizamos el cumplimiento de todos los requisitos legales aplicables y las normas exigidas por nuestros clientes.',
  },
  {
    titulo: 'Compromiso Colectivo',
    descripcion:
      'Fomentamos la participación de todos los niveles de la organización, generando un compromiso individual y colectivo de autocuidado.',
  },
  {
    titulo: 'Mejoramiento Continuo',
    descripcion:
      'Mantenemos altos estándares de Calidad en SSTA mediante la evaluación constante de nuestros sistemas y procesos de gestión.',
  },
  {
    titulo: 'Responsabilidad Social',
    descripcion:
      'Fomentamos la responsabilidad social con los grupos de interés para cada actividad, incluyendo proveedores y subcontratistas.',
  },
]

export function PoliticaIntegral() {
  return (
    <section className="px-12 py-20">
      <div className="mx-auto max-w-[1100px]">
        {/* Encabezado */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
              Política Integral
            </span>
          </span>
          <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-[#001124]">
            Nuestro compromiso con la calidad y el bienestar
          </h2>
        </div>

        {/* Bloque de texto */}
        <div className="mx-auto mb-14 max-w-[900px] rounded-[16px] border-l-4 border-[#004b98] bg-[#f0f5fb] p-8">
          <p className="text-[16px] leading-[1.75] text-[#44403c]">
            <strong>URBANOS &amp; RURALES S.A.S.</strong> es una empresa dedicada a los servicios de
            consultoría y asesoría en las áreas de ingeniería y derecho a nivel nacional, comprometida
            con el desarrollo del país y la satisfacción de todos sus clientes, responsable de promover
            un ambiente de trabajo sano y seguro, promoviendo y promocionando la prevención de los
            riesgos en seguridad y salud en el trabajo y ambiente, que permiten proteger a los
            colaboradores de accidentes de trabajo y enfermedades laborales, la contaminación
            ambiental, daño a la propiedad e impacto socio ambiental, desarrollando una planificación
            y preparación necesaria para identificar los impactos de pérdidas potenciales y mantener
            estrategias de recuperación necesarias ante la materialización de un incidente.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-[#44403c]">
            <strong>URBANOS &amp; RURALES S.A.S.</strong> garantiza el cumplimiento de los requisitos
            legales aplicables, al igual que las normas requeridas por los clientes, fomentando la
            participación de todos los niveles de la organización, generando un compromiso individual
            y colectivo de autocuidado en cada uno de los colaboradores y destinando los recursos
            necesarios para la planeación, ejecución y evaluación del{' '}
            <strong>Sistema de Seguridad, Salud en el Trabajo, Ambiente y Calidad (SIG)</strong>.
            Todo lo anterior enmarcado dentro del mejoramiento continuo y la eficacia de nuestros
            procesos, con el fin de mantener altos estándares de Calidad en SSTA, en pro del beneficio
            propio y de la satisfacción del cliente, teniendo en cuenta los proveedores, los
            subcontratistas y fomentando la responsabilidad social con los grupos de interés para
            cada actividad de la empresa.
          </p>
        </div>

        {/* Pilares */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILARES.map((pilar, i) => (
            <div
              key={pilar.titulo}
              className="rounded-[16px] border border-[#d8dfe4] bg-[#f8fafc] p-6 transition-shadow hover:shadow-md"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#004b98] text-[13px] font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold text-[#001124]">{pilar.titulo}</h3>
              <p className="mt-2 text-[14px] leading-[1.65] text-[#7a8187]">{pilar.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
