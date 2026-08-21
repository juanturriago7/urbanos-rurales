import { Link } from 'react-router-dom'
import { Container } from '@/shared/components/ui/Container'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/shared/components/icons/SocialIcons'
import { site } from '@/shared/config/site'

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
              { href: site.redes.facebook,  Icon: FacebookIcon,  label: 'Facebook' },
              { href: site.redes.instagram, Icon: InstagramIcon, label: 'Instagram' },
              { href: site.redes.linkedin,  Icon: LinkedinIcon,  label: 'LinkedIn' },
            ].map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                aria-label={label}
                className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] rounded-[8px] w-9 h-9 flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.15)] transition-colors duration-200">
                <Icon className="w-[15px] h-[15px]" />
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
