import { Link } from 'react-router-dom'
import { Container } from '@/shared/components/ui/Container'
import { site } from '@/shared/config/site'

const imgFacebook  = 'https://www.figma.com/api/mcp/asset/9b988c9f-0a56-4130-ad33-7b29b86e45e4.svg'
const imgInstagram = 'https://www.figma.com/api/mcp/asset/995df407-aba2-4d39-bc5c-c2f136e8bc49.svg'
const imgLinkedin  = 'https://www.figma.com/api/mcp/asset/c020e669-392e-43e7-b30c-1c56e548181f.svg'

export function Footer() {
  return (
    <footer id="contacto-footer" className="bg-[#001124]">
      <Container width="wide">
        {/* Fila principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 py-10">
          {/* Logo */}
          <div className="flex items-center gap-[10px]">
            <div className="bg-[rgba(255,255,255,0.12)] rounded-[8px] w-9 h-9 flex items-center justify-center">
              <span className="font-extrabold text-white text-[12px]">U&amp;R</span>
            </div>
            <div className="flex flex-col gap-[2px]">
              <span className="font-semibold text-white text-[14px]">Urbanos &amp; Rurales S.A.S</span>
              <span className="text-[#577782] text-[11px]">www.urbanosrurales.com</span>
            </div>
          </div>

          {/* Links nav */}
          <nav className="flex flex-wrap items-center gap-6">
            {[
              { label: 'Inicio',    to: '/' },
              { label: 'Inmuebles', to: '/inmuebles' },
              { label: 'Contacto',  anchor: 'contacto' },
            ].map((item) =>
              'anchor' in item ? (
                <a key={item.label} href={`/#${item.anchor}`}
                  className="text-[#7495a0] text-[13px] hover:text-white transition-colors duration-200">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.to}
                  className="text-[#7495a0] text-[13px] hover:text-white transition-colors duration-200">
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Redes sociales */}
          <div className="flex items-center gap-[10px]">
            {[
              { href: site.redes.facebook,  icon: imgFacebook,  label: 'Facebook' },
              { href: site.redes.instagram, icon: imgInstagram, label: 'Instagram' },
              { href: site.redes.linkedin,  icon: imgLinkedin,  label: 'LinkedIn' },
            ].map(({ href, icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                aria-label={label}
                className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] rounded-[8px] w-9 h-9 flex items-center justify-center hover:bg-[rgba(255,255,255,0.15)] transition-colors duration-200">
                <img src={icon} alt="" className="w-[15px] h-[15px]" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Separador + copyright */}
        <div className="border-t border-[rgba(255,255,255,0.08)] py-5 flex justify-center">
          <p className="text-[#51686f] text-[12px] text-center">
            © {new Date().getFullYear()} Urbanos &amp; Rurales S.A.S — Todos los derechos reservados · Bogotá, Colombia
          </p>
        </div>
      </Container>
    </footer>
  )
}
