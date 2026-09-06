import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { enviarPostulacion } from '@/features/public/institucional/api/postulacionesApi'

/**
 * Formulario "Trabaja con nosotros" — spec 07.
 *
 * El CV se sube de verdad al bucket (presign → PUT directo → crear la
 * postulación con el storageKey confirmado) — ver
 * features/public/institucional/api/postulacionesApi.ts. Ya no acepta una
 * URL externa pegada a mano.
 *
 * Validación client-side: el archivo debe ser un PDF real (por tipo MIME,
 * no por extensión del nombre) y pesar como máximo 5MB — el backend vuelve
 * a validar ambas cosas, esto solo evita gastar una subida completa cuando
 * es obvio que va a fallar.
 *
 * Estilo: paleta del sitio público (azul #004b98 / cian #00b5c5 / campos
 * #eff4f8), replicando el formulario de contacto de la landing. No usa los
 * componentes `Input`/`Button` del panel, que son crema/bronce.
 */

const MAX_BYTES_CV = 5 * 1024 * 1024

// Campo y etiqueta calcados del formulario de contacto de la landing.
const claseCampo =
  'rounded-[10px] border border-[#d2d8dd] bg-[#eff4f8] px-[17px] py-[13px] text-[14px] text-[#0d1c27] ' +
  'placeholder:text-[#757575] outline-none transition-colors focus:border-[#004b98] focus:bg-white'

const claseEtiqueta = 'text-[12px] font-semibold uppercase tracking-[0.6px] text-[#41596a]'

function Campo({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className={claseEtiqueta}>
        {label}
        {required && <span className="ml-1 text-[#00b5c5]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] leading-[1.5] text-[#7a8187]">{hint}</p>}
    </div>
  )
}

export function FormularioTrabajaConNosotros() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargoInteres, setCargoInteres] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cv, setCv] = useState<File | null>(null)
  const [aceptaTratamiento, setAceptaTratamiento] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [mensajeError, setMensajeError] = useState('')

  function handleSeleccionarCv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setMensajeError('')

    if (file && file.type !== 'application/pdf') {
      setCv(null)
      e.target.value = ''
      setMensajeError('El archivo debe ser un PDF.')
      return
    }
    if (file && file.size > MAX_BYTES_CV) {
      setCv(null)
      e.target.value = ''
      setMensajeError(`El PDF supera el máximo de ${MAX_BYTES_CV / (1024 * 1024)} MB.`)
      return
    }
    setCv(file)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMensajeError('')

    if (!aceptaTratamiento) {
      setMensajeError('Debes aceptar el tratamiento de datos personales.')
      return
    }
    if (!cv) {
      setMensajeError('Adjunta tu hoja de vida en PDF.')
      return
    }

    setEstado('enviando')
    try {
      await enviarPostulacion(
        {
          nombre: nombre.trim(),
          correo: correo.trim(),
          telefono: telefono.trim() || null,
          cargoInteres: cargoInteres.trim() || null,
          mensaje: mensaje.trim() || null,
        },
        cv,
      )
      setEstado('ok')
      setNombre(''); setCorreo(''); setTelefono(''); setCargoInteres('')
      setMensaje(''); setCv(null); setAceptaTratamiento(false)
    } catch (err) {
      setEstado('error')
      setMensajeError(err instanceof Error ? err.message : 'Error desconocido.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <Campo id="tcn-nombre" label="Nombre completo" required>
          <input
            id="tcn-nombre"
            className={claseCampo}
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Campo>
        <Campo id="tcn-correo" label="Correo electrónico" required>
          <input
            id="tcn-correo"
            type="email"
            className={claseCampo}
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </Campo>
        <Campo id="tcn-telefono" label="Teléfono">
          <input
            id="tcn-telefono"
            type="tel"
            className={claseCampo}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </Campo>
        <Campo id="tcn-cargo" label="Cargo de interés">
          <input
            id="tcn-cargo"
            className={claseCampo}
            value={cargoInteres}
            onChange={(e) => setCargoInteres(e.target.value)}
            placeholder="Ej. Consultor junior, Topógrafo..."
          />
        </Campo>
      </div>

      <Campo id="tcn-mensaje" label="Mensaje (opcional)">
        <textarea
          id="tcn-mensaje"
          rows={4}
          className={`${claseCampo} resize-none`}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
      </Campo>

      <Campo
        id="tcn-cv"
        label="Tu hoja de vida (PDF)"
        required
        hint={cv ? `Archivo seleccionado: ${cv.name}` : `Máximo ${MAX_BYTES_CV / (1024 * 1024)} MB.`}
      >
        <input
          id="tcn-cv"
          type="file"
          accept="application/pdf"
          required
          onChange={handleSeleccionarCv}
          className={`${claseCampo} file:mr-3 file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#004b98] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white hover:file:bg-[#003b7a]`}
        />
      </Campo>

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

      {estado === 'ok' && (
        <p className="rounded-[10px] border border-[#a9dde3] bg-[#e8f7f9] px-4 py-3 text-[13px] leading-[1.5] text-[#0a5b66]">
          ¡Recibimos tu postulación! Te contactaremos al correo registrado.
        </p>
      )}
      {estado === 'error' && mensajeError && (
        <p className="rounded-[10px] border border-[#f0c2c2] bg-[#fdf2f2] px-4 py-3 text-[13px] leading-[1.5] text-[#b42318]">
          {mensajeError}
        </p>
      )}

      <div className="mt-1 flex justify-end">
        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#004b98] px-[30px] py-[14px] text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#003b7a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004b98] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {estado === 'enviando' && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {estado === 'enviando' ? 'Enviando...' : 'Enviar postulación'}
        </button>
      </div>
    </form>
  )
}
