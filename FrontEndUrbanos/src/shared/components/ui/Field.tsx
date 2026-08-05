import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

/**
 * Campos de formulario del panel. Encapsulan etiqueta, control y mensaje de error
 * para que las páginas no repitan las mismas clases de Tailwind en cada input.
 * Compatibles con el `register()` de React Hook Form vía forwardRef.
 */

const claseControl = [
  'mt-1 w-full rounded-control border border-border px-3 py-2 text-sm',
  'transition-colors focus:border-b-2 focus:border-b-brand-600',
  'disabled:bg-surface-muted disabled:text-text-secondary',
].join(' ')

interface EnvolturaProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Envoltura({ label, error, hint, required, children, className = '' }: EnvolturaProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, wrapperClassName, ...props }, ref) => (
    <Envoltura
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <input ref={ref} className={claseControl} {...props} />
    </Envoltura>
  ),
)
Input.displayName = 'Input'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, wrapperClassName, children, ...props }, ref) => (
    <Envoltura
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <select ref={ref} className={claseControl} {...props}>
        {children}
      </select>
    </Envoltura>
  ),
)
Select.displayName = 'Select'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, wrapperClassName, ...props }, ref) => (
    <Envoltura
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <textarea ref={ref} className={claseControl} {...props} />
    </Envoltura>
  ),
)
Textarea.displayName = 'Textarea'
