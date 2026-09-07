import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { useAgendarVisita } from '@/features/public/visitas/hooks/useAgendarVisita'
import { franjasDisponibles } from '@/features/public/visitas/api/visitasApi'

/**
 * Modal "Agendar visita" del detalle de inmueble. Estilo de la paleta pública
 * (azul #004b98 / cian #00b5c5 / campos #eff4f8), calcado del formulario de
 * contacto. Reusa el patrón de diálogo del lightbox de la misma página
 * (fixed inset-0 + role="dialog" + Escape para cerrar).
 *
 * El montaje/desmontaje lo controla el padre (`{open && <AgendarVisitaModal/>}`),
 * así cada apertura arranca con el formulario limpio sin resetear estado a mano.
 */

interface Props {
  inmuebleId: number
  codigoReferencia: string
  titulo: string
  onClose: () => void
}

const claseCampo =
  'rounded-[10px] border border-[#d2d8dd] bg-[#eff4f8] px-[15px] py-[11px] text-[14px] text-[#0d1c27] ' +
  'placeholder:text-[#757575] outline-none transition-colors focus:border-[#004b98] focus:bg-white ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const claseEtiqueta = 'text-[12px] font-semibold uppercase tracking-[0.6px] text-[#41596a]'

function Campo({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className={claseEtiqueta}>
        {label}
        {required && <span className="ml-1 text-[#00b5c5]">*</span>}
      </label>
      {children}
    </div>
  )
}

const aISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const formateaConfirmacion = (iso: string) => {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AgendarVisitaModal({ inmuebleId, codigoReferencia, titulo, onClose }: Props) {
  const agendar = useAgendarVisita()

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fecha, setFecha] = useState('')
  const [franja, setFranja] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [sitio, setSitio] = useState('') // honeypot
  const [aceptaTratamiento, setAceptaTratamiento] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const { minFecha, maxFecha } = useMemo(() => {
    const hoy = new Date()
    const min = new Date(hoy)
    min.setDate(min.getDate() + 1)
    const max = new Date(hoy)
    max.setDate(max.getDate() + 60)
    return { minFecha: aISO(min), maxFecha: aISO(max) }
  }, [])

  const franjas = useMemo(() => (fecha ? franjasDisponibles(fecha) : []), [fecha])

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onClose])

  function cambiarFecha(valor: string) {
    setFecha(valor)
    // La franja depende de la fecha: al cambiarla se vuelve a elegir.
    setFranja('')
  }

  const errorServidor = agendar.isError
    ? isAxiosError(agendar.error)
      ? ((agendar.error.response?.data as { detail?: string; title?: string })?.detail ??
        (agendar.error.response?.data as { title?: string })?.title ??
        'No se pudo agendar la visita. Intenta de nuevo.')
      : 'No se pudo agendar la visita. Intenta de nuevo.'
    : ''

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorForm('')

    if (!fecha || !franja) {
      setErrorForm('Elige la fecha y la franja de la visita.')
      return
    }
    if (!aceptaTratamiento) {
      setErrorForm('Debes aceptar el tratamiento de datos personales.')
      return
    }

    try {
      await agendar.mutateAsync({
        inmuebleId,
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || null,
        fecha,
        franja,
        mensaje: mensaje.trim() || null,
        aceptoTratamientoDatos: aceptaTratamiento,
        sitio: sitio || undefined,
      })
    } catch {
      // el estado de error ya lo expone agendar.isError
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Agendar visita — ${titulo}`}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-white p-6 sm:max-w-[520px] sm:rounded-[20px] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.3px] text-[#001124]">
              Agendar visita
            </h2>
            <p className="mt-1 text-[13px] text-[#7a8187]">
              {codigoReferencia} · {titulo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 rounded-[8px] p-1 text-[#7a8187] transition-colors hover:bg-[#eff4f8] hover:text-[#001124]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {agendar.isSuccess ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-[10px] border border-[#a9dde3] bg-[#e8f7f9] px-4 py-3 text-[13px] leading-[1.5] text-[#0a5b66]">
              ¡Listo! Recibimos tu solicitud de visita para el{' '}
              <strong>{formateaConfirmacion(agendar.data.inicioLocal)}</strong>. Un asesor te
              confirmará por correo la visita y la dirección exacta.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[10px] bg-[#004b98] px-[26px] py-[12px] text-[14px] font-bold text-white transition-colors hover:bg-[#003b7a]"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <Campo id="av-nombre" label="Nombre completo" required>
                <input
                  id="av-nombre"
                  className={claseCampo}
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </Campo>
              <Campo id="av-correo" label="Correo electrónico" required>
                <input
                  id="av-correo"
                  type="email"
                  className={claseCampo}
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </Campo>
              <Campo id="av-telefono" label="Teléfono">
                <input
                  id="av-telefono"
                  type="tel"
                  className={claseCampo}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </Campo>
              <Campo id="av-fecha" label="Fecha" required>
                <input
                  id="av-fecha"
                  type="date"
                  className={claseCampo}
                  required
                  min={minFecha}
                  max={maxFecha}
                  value={fecha}
                  onChange={(e) => cambiarFecha(e.target.value)}
                />
              </Campo>
            </div>

            <Campo id="av-franja" label="Franja horaria" required>
              <select
                id="av-franja"
                className={claseCampo}
                required
                disabled={!fecha || franjas.length === 0}
                value={franja}
                onChange={(e) => setFranja(e.target.value)}
              >
                <option value="">
                  {!fecha
                    ? 'Elige primero una fecha'
                    : franjas.length === 0
                      ? 'Ese día no hay atención'
                      : 'Selecciona una franja'}
                </option>
                {franjas.map((f) => (
                  <option key={f} value={f}>
                    {f} – {String(Number(f.slice(0, 2)) + 1).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="av-mensaje" label="Mensaje (opcional)">
              <textarea
                id="av-mensaje"
                rows={3}
                className={`${claseCampo} resize-none`}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
            </Campo>

            {/* Honeypot anti-spam: oculto para humanos. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="av-sitio">No llenar</label>
              <input
                id="av-sitio"
                tabIndex={-1}
                autoComplete="off"
                value={sitio}
                onChange={(e) => setSitio(e.target.value)}
              />
            </div>

            <label className="flex items-start gap-[10px] text-[13px] leading-[1.55] text-[#5a6b78]">
              <input
                type="checkbox"
                checked={aceptaTratamiento}
                onChange={(e) => setAceptaTratamiento(e.target.checked)}
                className="mt-[3px] h-4 w-4 shrink-0 accent-[#004b98]"
              />
              <span>
                Acepto el tratamiento de mis datos personales conforme a la política de privacidad.
              </span>
            </label>

            {(errorForm || errorServidor) && (
              <p className="rounded-[10px] border border-[#f0c2c2] bg-[#fdf2f2] px-4 py-3 text-[13px] leading-[1.5] text-[#b42318]">
                {errorForm || errorServidor}
              </p>
            )}

            <div className="mt-1 flex justify-end">
              <button
                type="submit"
                disabled={agendar.isPending}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#004b98] px-[28px] py-[13px] text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#003b7a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004b98] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {agendar.isPending && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {agendar.isPending ? 'Enviando…' : 'Solicitar visita'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
