import { useEffect } from 'react'

/**
 * Anima con fade+slide (`.reveal`) o fade+scale (`.reveal-scale`) los
 * elementos marcados con esas clases cuando entran en el viewport, agregando
 * `.visible` (ver definiciones y el fallback de prefers-reduced-motion en
 * src/index.css). Cada elemento se anima una sola vez.
 *
 * Extraído de HomePage.tsx para reutilizarlo en otras páginas sin duplicar
 * el IntersectionObserver.
 */
export function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.08 },
    )
    document.querySelectorAll('.reveal, .reveal-scale').forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
}
