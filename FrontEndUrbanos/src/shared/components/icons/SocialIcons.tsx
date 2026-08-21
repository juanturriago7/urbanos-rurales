interface IconProps {
  className?: string
}

/**
 * lucide-react no incluye logos de marca (Facebook, Instagram, LinkedIn) —
 * fueron retirados de la librería hace varias versiones. Se dibujan aquí
 * como SVG inline, siguiendo el mismo patrón que WhatsAppIcon.
 */

export function FacebookIcon({ className = '' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15 3h-2a5 5 0 0 0-5 5v3H6v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export function InstagramIcon({ className = '' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LinkedinIcon({ className = '' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="7" cy="6.7" r="0.75" fill="currentColor" stroke="none" />
      <line x1="7" y1="10" x2="7" y2="17" />
      <line x1="11" y1="10" x2="11" y2="17" />
      <path d="M11 13.2a2.3 2.3 0 0 1 4.6 0V17" />
    </svg>
  )
}
