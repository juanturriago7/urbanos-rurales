import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from '@/app/layouts/public/Footer'
import { Header } from '@/app/layouts/public/Header'
import { WhatsAppFab } from '@/shared/components/WhatsAppFab'

/**
 * Shell del sitio público: ensambla las piezas y es dueño del estado del drawer.
 *
 * El header es `fixed`, así que no ocupa espacio en el flujo. En la landing eso
 * es lo que se busca — flota sobre el hero. En el resto de rutas hay que
 * compensar con un padding superior, o el contenido arrancaría debajo de él.
 *
 * El estado del drawer vive aquí y no en el `Header` por una razón concreta:
 * este es el único componente que tiene a `<main>` y `<footer>` como hijos y
 * puede marcarlos `inert` mientras el panel está abierto. El focus trap del
 * drawer contiene la tabulación, pero sin `inert` el cursor virtual de un
 * lector de pantalla sigue recorriendo el contenido de detrás del overlay, y
 * entonces el diálogo no es realmente modal.
 */
export function PublicLayout() {
  const location = useLocation()
  const esLanding = location.pathname === '/'

  const [drawerAbierto, setDrawerAbierto] = useState(false)

  // `useCallback` aquí NO es una optimización: es obligatorio.
  // El `Header` cierra el drawer al cambiar de ruta con un efecto cuyas
  // dependencias incluyen `onCerrarDrawer`. Si la identidad de esa función
  // cambiara en cada render, el efecto se reejecutaría en cada render y
  // cerraría el drawer inmediatamente después de abrirlo — el panel no llegaría
  // a verse nunca.
  const abrirDrawer = useCallback(() => setDrawerAbierto(true), [])
  const cerrarDrawer = useCallback(() => setDrawerAbierto(false), [])

  return (
    <div className="bg-surface text-text-primary flex min-h-screen flex-col font-sans">
      <a
        href="#contenido"
        className="focus:rounded-control focus:bg-surface focus:text-brand-700 focus:shadow-dropdown sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Saltar al contenido
      </a>

      <Header
        drawerAbierto={drawerAbierto}
        onAbrirDrawer={abrirDrawer}
        onCerrarDrawer={cerrarDrawer}
      />

      {/* `inert` saca a estos dos del árbol de accesibilidad y del foco
          mientras el drawer está abierto. React 19 lo soporta de forma nativa. */}
      <main
        id="contenido"
        // El enlace "Saltar al contenido" solo mueve el foco de teclado aqui si
        // el destino es enfocable: sin tabIndex, el navegador hace scroll pero
        // el foco se queda donde estaba, y el salto de teclado no sirve de nada.
        tabIndex={-1}
        inert={drawerAbierto}
        className={['flex-1 focus:outline-none', esLanding ? '' : 'pt-20'].join(' ')}
      >
        <Outlet />
      </main>

      <div inert={drawerAbierto}>
        <Footer />
        <WhatsAppFab />
      </div>
    </div>
  )
}
