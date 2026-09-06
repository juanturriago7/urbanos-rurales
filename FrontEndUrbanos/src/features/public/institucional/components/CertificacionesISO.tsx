const CERTIFICACIONES = [
  {
    norma: 'ISO 9001',
    titulo: 'Sistema de Gestión de Calidad',
    descripcion:
      'Certifica nuestros procesos de consultoría y gestión predial bajo los más altos estándares de calidad, asegurando la satisfacción de nuestros clientes en cada proyecto.',
    colorBg: '#004b98',
    colorTag: '#004b98',
    colorTagBg: 'rgba(0,75,152,0.08)',
  },
  {
    norma: 'ISO 14001',
    titulo: 'Sistema de Gestión Ambiental',
    descripcion:
      'Acredita nuestro compromiso con el medio ambiente, garantizando prácticas responsables y sostenibles en todas nuestras operaciones de consultoría e ingeniería.',
    colorBg: '#00855a',
    colorTag: '#00855a',
    colorTagBg: 'rgba(0,133,90,0.08)',
  },
]

export function CertificacionesISO() {
  return (
    <section className="bg-[#001124] px-12 py-20">
      <div className="mx-auto max-w-[1100px]">
        {/* Encabezado */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-[rgba(0,181,197,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#00b5c5]">
              Certificaciones
            </span>
          </span>
          <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-white">
            Avalados por estándares internacionales
          </h2>
          <p className="mx-auto mt-3 max-w-[600px] text-[16px] leading-[1.65] text-[#8bb6c4]">
            Estamos certificados en las normas ISO 9001 e ISO 14001, certificaciones que nos
            consolidan como una empresa comprometida con la calidad y el medio ambiente en cada uno
            de nuestros procesos de consultoría y gestión predial integral.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 sm:grid-cols-2">
          {CERTIFICACIONES.map((cert) => (
            <div
              key={cert.norma}
              className="overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]"
            >
              {/* Banner */}
              <div
                className="flex items-center justify-center py-10"
                style={{ background: cert.colorBg }}
              >
                <span className="text-[48px] font-black tracking-tight text-white">{cert.norma}</span>
              </div>

              {/* Contenido */}
              <div className="p-8 text-center">
                <div
                  className="mb-3 inline-block rounded-full px-3 py-1 text-[12px] font-bold"
                  style={{ background: cert.colorTagBg, color: cert.colorTag === '#004b98' ? '#7ab3ff' : '#4cd9a0' }}
                >
                  {cert.norma}
                </div>
                <h3 className="text-[20px] font-bold text-white">{cert.titulo}</h3>
                <p className="mt-3 text-[14px] leading-[1.65] text-[#8bb6c4]">{cert.descripcion}</p>

                {/* Verificado */}
                <div className="mt-6 flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-[#00b5c5]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[14px] font-medium text-[#8bb6c4]">Certificación vigente</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
