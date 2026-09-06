import { useState } from 'react'
import { useCaracteristicas } from '@/features/admin/catalogos/hooks/useCatalogos'
import {
  useActualizarCaracteristica,
  useActualizarCategoria,
  useCrearCaracteristica,
  // TEMP regresión (INM-WEB-001): alta de categoría oculta a pedido. Para
  // restaurar: descomentar este import, `crearCat`, el state `nuevaCategoria`,
  // `agregarCategoria` y la <section> "Nueva categoría" de más abajo.
  // useCrearCategoria,
} from '@/features/admin/catalogos/hooks/useCaracteristicasAdmin'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import type {
  CaracteristicaDto,
  CategoriaCaracteristicaDto,
} from '@/features/admin/catalogos/api/catalogosApi'

type TipoValor = 'booleano' | 'numero' | 'texto'

/**
 * Página admin de características — CRUD sobre `categorias_caracteristica`
 * y `caracteristicas`. Spec 02. La marca "Filtrable" decide si el checkbox
 * aparece en el panel de filtros público de /inmuebles (spec 04).
 */
export function CaracteristicasAdminPage() {
  const { data: categorias, isLoading, isError, error } = useCaracteristicas()
  // TEMP regresión (INM-WEB-001): alta de categoría oculta.
  // const crearCat = useCrearCategoria()
  const actualizarCat = useActualizarCategoria()
  const crearCaract = useCrearCaracteristica()
  const actualizarCaract = useActualizarCaracteristica()

  // TEMP regresión (INM-WEB-001): alta de categoría oculta.
  // const [nuevaCategoria, setNuevaCategoria] = useState('')

  // function agregarCategoria() {
  //   const nombre = nuevaCategoria.trim()
  //   if (!nombre) return
  //   crearCat.mutate({ nombre }, { onSuccess: () => setNuevaCategoria('') })
  // }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Características</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Las categorías (ej. "Zonas comunes") agrupan características (ej. "Zona de
          vacas", "Restaurante interno"). Las marcadas como filtrables aparecen como
          checkboxes en el filtro público de /inmuebles.
        </p>
      </div>

      {/*
        TEMP regresión (INM-WEB-001): alta de categoría oculta a pedido. Para
        restaurar: descomentar esta <section> y sus dependencias arriba (import
        useCrearCategoria, crearCat, state nuevaCategoria, agregarCategoria).

      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Nueva categoría
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarCategoria()}
            placeholder="Nombre de la categoría"
            disabled={crearCat.isPending}
            className="rounded-control border border-border px-3 py-2 text-sm transition-colors focus:border-b-2 focus:border-b-brand-600 focus:outline-none disabled:bg-surface-muted"
          />
          <Button onClick={agregarCategoria} isLoading={crearCat.isPending}>+ crear</Button>
          {crearCat.isError && (
            <span className="text-xs text-error">
              {crearCat.error instanceof Error ? crearCat.error.message : 'Error.'}
            </span>
          )}
        </div>
      </section>
      */}

      <section className="rounded-[--radius-card] border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Categorías y características
        </h3>

        {isLoading && (
          <div className="flex justify-center py-8"><Spinner size="md" /></div>
        )}
        {isError && (
          <div className="rounded-control border border-red-200 bg-red-50 p-4 text-sm text-error">
            Error: {error instanceof Error ? error.message : 'desconocido'}
          </div>
        )}

        {categorias && categorias.length === 0 && (
          <p className="rounded-control border border-dashed border-border p-6 text-center text-sm text-text-secondary">
            Aún no hay categorías.
          </p>
        )}

        {categorias && categorias.length > 0 && (
          <ul className="space-y-4">
            {categorias.map((cat) => (
              <CategoriaSeccion
                key={cat.id}
                categoria={cat}
                onCrear={(input) => crearCaract.mutate({ categoriaId: cat.id, ...input })}
                onActualizar={(input) => actualizarCaract.mutate(input)}
                onActualizarCategoria={(input) =>
                  actualizarCat.mutate({ id: cat.id, ...input })
                }
                creando={crearCaract.isPending}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

interface CategoriaSeccionProps {
  categoria: CategoriaCaracteristicaDto
  onCrear: (input: { nombre: string; tipoValor: TipoValor; filtrable: boolean; icono?: string | null }) => void
  onActualizar: (input: { id: number; nombre: string; tipoValor: TipoValor; filtrable: boolean; icono?: string | null; activo: boolean }) => void
  onActualizarCategoria: (input: { nombre: string; orden: number; activo: boolean }) => void
  creando: boolean
}

function CategoriaSeccion({
  categoria, onCrear, onActualizar, creando,
}: CategoriaSeccionProps) {
  const [agregando, setAgregando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTipoValor, setNuevoTipoValor] = useState<TipoValor>('booleano')

  function guardarNueva() {
    if (!nuevoNombre.trim()) return
    onCrear({ nombre: nuevoNombre.trim(), tipoValor: nuevoTipoValor, filtrable: true })
    setNuevoNombre('')
    setAgregando(false)
  }

  return (
    <li className="rounded-control border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-text-primary">{categoria.nombre}</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAgregando((v) => !v)}
          className="text-brand-700"
        >
          + nueva característica
        </Button>
      </div>

      {agregando && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-control bg-surface-muted p-2">
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardarNueva()}
            placeholder="Nombre (ej. Zona de vacas)"
            autoFocus
            className="rounded-control border border-border bg-white px-2 py-1 text-sm focus:border-b-2 focus:border-b-brand-600 focus:outline-none"
          />
          <select
            value={nuevoTipoValor}
            onChange={(e) => setNuevoTipoValor(e.target.value as TipoValor)}
            className="rounded-control border border-border bg-white px-2 py-1 text-sm"
          >
            <option value="booleano">Booleano</option>
            <option value="numero">Número</option>
            <option value="texto">Texto</option>
          </select>
          <Button size="sm" variant="primary" onClick={guardarNueva} isLoading={creando}>
            Crear
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAgregando(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {categoria.caracteristicas.length === 0 ? (
        <p className="text-xs text-text-secondary">Sin características en esta categoría.</p>
      ) : (
        <ul className="space-y-1">
          {categoria.caracteristicas.map((c) => (
            <CaracteristicaFila key={c.id} caract={c} onActualizar={onActualizar} />
          ))}
        </ul>
      )}
    </li>
  )
}

function CaracteristicaFila({
  caract, onActualizar,
}: {
  caract: CaracteristicaDto
  onActualizar: CategoriaSeccionProps['onActualizar']
}) {
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(caract.nombre)
  const [tipoEdit, setTipoEdit] = useState<TipoValor>(caract.tipoValor as TipoValor)

  function guardar() {
    if (!nombreEdit.trim()) return
    onActualizar({
      id: caract.id,
      nombre: nombreEdit.trim(),
      tipoValor: tipoEdit,
      filtrable: caract.filtrable,
      icono: caract.icono,
      activo: caract.activo,
    })
    setEditando(false)
  }

  function toggleFiltrable() {
    onActualizar({
      id: caract.id,
      nombre: caract.nombre,
      tipoValor: caract.tipoValor as TipoValor,
      filtrable: !caract.filtrable,
      icono: caract.icono,
      activo: caract.activo,
    })
  }

  function toggleActivo() {
    onActualizar({
      id: caract.id,
      nombre: caract.nombre,
      tipoValor: caract.tipoValor as TipoValor,
      filtrable: caract.filtrable,
      icono: caract.icono,
      activo: !caract.activo,
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-1">
      {editando ? (
        <>
          <input
            value={nombreEdit}
            onChange={(e) => setNombreEdit(e.target.value)}
            className="rounded-control border border-border bg-white px-2 py-0.5 text-sm focus:border-b-2 focus:border-b-brand-600 focus:outline-none"
          />
          <select
            value={tipoEdit}
            onChange={(e) => setTipoEdit(e.target.value as TipoValor)}
            className="rounded-control border border-border bg-white px-2 py-0.5 text-sm"
          >
            <option value="booleano">booleano</option>
            <option value="numero">número</option>
            <option value="texto">texto</option>
          </select>
          <Button size="sm" variant="primary" onClick={guardar}>Guardar</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
        </>
      ) : (
        <>
          <span className={caract.activo ? 'text-sm' : 'text-sm text-text-secondary line-through'}>
            {caract.nombre}
          </span>
          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            {caract.tipoValor}
          </span>
          {caract.filtrable && (
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              filtrable
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={toggleFiltrable}>
            {caract.filtrable ? 'Quitar filtro' : 'Marcar filtrable'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleActivo}
            className={caract.activo ? 'text-error hover:bg-red-50' : 'text-brand-700'}
          >
            {caract.activo ? 'Desactivar' : 'Reactivar'}
          </Button>
        </>
      )}
    </li>
  )
}
