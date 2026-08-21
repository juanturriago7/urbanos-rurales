import { useState } from 'react'
import { Input, Textarea } from '@/shared/components/ui/Field'
import { Button } from '@/shared/components/ui/Button'

/**
 * Formulario "Trabaja con nosotros" — spec 07.
 *
 * v1 simplificado: el CV se recibe como URL directa (no flujo presign →
 * PUT directo al bucket). El cliente pega el link a su PDF ya subido al
 * CDN. El flujo presign completo queda como fast-follow si el cliente
 * pide subir el archivo desde el panel.
 *
 * Validación client-side: la URL debe terminar en .pdf (no se gasta
 * un postulación si el archivo claramente no es PDF).
 */
export function FormularioTrabajaConNosotros() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargoInteres, setCargoInteres] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cvUrl, setCvUrl] = useState('')
  const [aceptaTratamiento, setAceptaTratamiento] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [mensajeError, setMensajeError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMensajeError('')

    if (!aceptaTratamiento) {
      setMensajeError('Debes aceptar el tratamiento de datos personales.')
      return
    }
    if (!cvUrl.trim().toLowerCase().endsWith('.pdf')) {
      setMensajeError('La URL del CV debe terminar en .pdf')
      return
    }

    setEstado('enviando')
    try {
      // v1: construimos un storageKey estable a partir de la URL del CV.
      // Si se agrega el flujo presign, este campo lo provee el backend.
      const storageKey = `postulaciones/${Date.now()}-${nombre.replace(/\s+/g, '_')}.pdf`

      const resp = await fetch('/api/postulaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim(),
          telefono: telefono.trim() || null,
          cargoInteres: cargoInteres.trim() || null,
          mensaje: mensaje.trim() || null,
          cvStorageKey: storageKey,
          cvUrl: cvUrl.trim(),
        }),
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => null)
        throw new Error(data?.detail ?? data?.title ?? 'Error al enviar la postulación.')
      }
      setEstado('ok')
      setNombre(''); setCorreo(''); setTelefono(''); setCargoInteres('')
      setMensaje(''); setCvUrl(''); setAceptaTratamiento(false)
    } catch (err) {
      setEstado('error')
      setMensajeError(err instanceof Error ? err.message : 'Error desconocido.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre completo"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Input
          label="Correo electrónico"
          required
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Input
          label="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <Input
          label="Cargo de interés"
          value={cargoInteres}
          onChange={(e) => setCargoInteres(e.target.value)}
          placeholder="Ej. Consultor junior, Topógrafo..."
        />
      </div>
      <Textarea
        label="Mensaje (opcional)"
        rows={4}
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
      />
      <Input
        label="URL de tu hoja de vida (PDF)"
        required
        value={cvUrl}
        onChange={(e) => setCvUrl(e.target.value)}
        placeholder="https://ejemplo.com/mi-cv.pdf"
        hint="Pega aquí el enlace a tu CV en PDF (Google Drive, Dropbox, etc.). v1."
      />

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={aceptaTratamiento}
          onChange={(e) => setAceptaTratamiento(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[#004b98]"
        />
        <span className="text-text-secondary">
          Acepto el tratamiento de mis datos personales conforme a la política de privacidad.
        </span>
      </label>

      {estado === 'ok' && (
        <div className="rounded-control border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          ¡Recibimos tu postulación! Te contactaremos al correo registrado.
        </div>
      )}
      {estado === 'error' && mensajeError && (
        <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-error">
          {mensajeError}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={estado === 'enviando'}>
          Enviar postulación
        </Button>
      </div>
    </form>
  )
}
