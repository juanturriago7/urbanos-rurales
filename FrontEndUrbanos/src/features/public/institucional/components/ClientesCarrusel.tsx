import { useEffect, useRef, useState } from 'react'

const CLIENTES = [
  { nombre: 'INVÍAS', logo: '/clientes/invias.png' },
  { nombre: 'ANI', logo: '/clientes/ani.png' },
  { nombre: 'FINDETER', logo: '/clientes/findeter.png' },
  { nombre: 'IDEAM', logo: '/clientes/ideam.png' },
  { nombre: 'EPM', logo: '/clientes/epm.jpg' },
  { nombre: 'ISA', logo: '/clientes/isa.jpg' },
  { nombre: 'GEB', logo: '/clientes/geb.png' },
  { nombre: 'COMPENSAR', logo: '/clientes/compensar.png' },
  { nombre: 'GOBERNACIÓN DE CUNDINAMARCA', logo: '/clientes/gobernacion-cundinamarca.jpg' },
  { nombre: 'ALCALDÍA DE BOGOTÁ', logo: '/clientes/alcaldia-bogota.jpg' },
]

export function ClientesCarrusel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)

  // Duplicamos los items para efecto infinito
  const items = [...CLIENTES, ...CLIENTES]

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const speed = 0.5 // px por frame

    const animate = () => {
      if (!isPaused) {
        const totalWidth = track.scrollWidth / 2
        posRef.current += speed
        if (posRef.current >= totalWidth) {
          posRef.current = 0
        }
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPaused])

  return (
    <section className="bg-[#eff4f8] px-12 py-20">
      <div className="mx-auto max-w-[1100px]">
        {/* Encabezado */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-[rgba(0,75,152,0.08)] px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[#004b98]">
              Nuestros clientes
            </span>
          </span>
          <h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.5px] text-[#001124]">
            Empresas que confían en nosotros
          </h2>
          <p className="mx-auto mt-3 max-w-[600px] text-[16px] leading-[1.65] text-[#7a8187]">
            Trabajamos con entidades del sector público y privado a nivel nacional, entregando
            soluciones de consultoría y gestión predial con los más altos estándares de calidad.
          </p>
        </div>

        {/* Carrusel */}
        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          aria-label="Carrusel de clientes"
        >
          <div ref={trackRef} className="flex items-center gap-10 will-change-transform">
            {items.map((cliente, idx) => (
              <div
                key={idx}
                className="flex min-w-[160px] flex-col items-center justify-center rounded-[16px] border border-[#d8dfe4] bg-white px-6 py-4 shadow-sm transition-shadow hover:shadow-md"
                aria-label={cliente.nombre}
              >
                <img
                  src={cliente.logo}
                  alt={cliente.nombre}
                  className="h-12 w-auto object-contain grayscale transition-all hover:grayscale-0"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.fallback-name')) {
                      const span = document.createElement('span')
                      span.className =
                        'fallback-name text-[11px] font-semibold text-[#7a8187] text-center leading-tight'
                      span.textContent = cliente.nombre
                      parent.appendChild(span)
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
