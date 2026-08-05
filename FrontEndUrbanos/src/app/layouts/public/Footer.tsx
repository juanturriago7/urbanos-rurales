import { Link } from 'react-router-dom'
import { AnchorLink } from '@/app/layouts/public/AnchorLink'
import { Container } from '@/shared/components/ui/Container'
import { Logo } from '@/shared/components/ui/Logo'
import { site } from '@/shared/config/site'

/**
 * Pie del sitio público. Junto al overlay del hero, la única superficie oscura
 * del diseño.
 *
 * Solo figura la sede de Bogotá: la oficina de Medellín que mencionaba el
 * documento de UX/UI original no existe.
 */
const claseEnlace = 'text-text-muted-inverse transition-colors hover:text-white'

const redes = [
  { nombre: 'Facebook', url: site.redes.facebook },
  { nombre: 'Instagram', url: site.redes.instagram },
  { nombre: 'YouTube', url: site.redes.youtube },
  { nombre: 'LinkedIn', url: site.redes.linkedin },
]

export function Footer() {
  return (
    <footer id="contacto" className="bg-surface-dark">
      <Container width="wide">
        <div className="grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" aria-label={`${site.nombreCorto} — Ir al inicio`}>
              <Logo variant="light" />
            </Link>
            <p className="text-text-muted-inverse mt-4 text-sm">{site.lema}</p>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold tracking-[1.5px] text-white uppercase">
              Servicios
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li>
                <Link to="/inmuebles?operacion=arriendo" className={claseEnlace}>
                  Arrendar
                </Link>
              </li>
              <li>
                <Link to="/inmuebles?operacion=venta" className={claseEnlace}>
                  Comprar
                </Link>
              </li>
              <li>
                <AnchorLink anchor="consignar" className={claseEnlace}>
                  Consignar
                </AnchorLink>
              </li>
              <li>
                <AnchorLink anchor="servicios" className={claseEnlace}>
                  Avalúos
                </AnchorLink>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold tracking-[1.5px] text-white uppercase">
              Contacto
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={`tel:${site.contacto.telefono.replace(/[^\d+]/g, '')}`}
                  className={claseEnlace}
                >
                  {site.contacto.telefono}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${site.contacto.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={claseEnlace}
                >
                  {site.contacto.whatsappVisible}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contacto.email}`} className={claseEnlace}>
                  {site.contacto.email}
                </a>
              </li>
              <li className="text-text-muted-inverse">
                {site.direccion.calle}
                <br />
                {site.direccion.edificio}
                <br />
                {site.direccion.ciudad}, {site.direccion.pais}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold tracking-[1.5px] text-white uppercase">
              Síguenos
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {redes.map((red) => (
                <li key={red.nombre}>
                  <a
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={claseEnlace}
                  >
                    {red.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <div className="bg-surface-darker">
        <Container width="wide">
          <div className="text-text-muted-inverse flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {site.razonSocial}. Todos los derechos reservados.
            </p>
            <a
              href={site.legal.politicaPrivacidad}
              target="_blank"
              rel="noopener noreferrer"
              className={claseEnlace}
            >
              Política de Privacidad y Datos
            </a>
          </div>
        </Container>
      </div>
    </footer>
  )
}
