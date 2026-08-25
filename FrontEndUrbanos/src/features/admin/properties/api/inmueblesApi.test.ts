import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const { apiClient } = await import('@/shared/lib/axios')
const { actualizarInmueble, getInmuebleAdmin, upsertOperacion } =
  await import('@/features/admin/properties/api/inmueblesApi')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getInmuebleAdmin', () => {
  it('pega al detalle admin del id y devuelve el cuerpo', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 7, titulo: 'Casa' } })

    const dto = await getInmuebleAdmin(7)

    expect(apiClient.get).toHaveBeenCalledWith('/api/admin/inmuebles/7')
    expect(dto.id).toBe(7)
  })
})

describe('actualizarInmueble', () => {
  it('hace PUT al recurso del id con el payload de campos', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: undefined })
    const input = { titulo: 'Casa nueva' } as never

    await actualizarInmueble(7, input)

    expect(apiClient.put).toHaveBeenCalledWith('/api/admin/inmuebles/7', input)
  })
})

describe('upsertOperacion', () => {
  it('hace PUT a la subruta de operaciones con UNA operación', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: undefined })
    const op = {
      tipoOperacion: 'venta' as const,
      precio: 1000,
      cuotaAdministracion: null,
      adminIncluida: false,
      activo: true,
    }

    await upsertOperacion(7, op)

    expect(apiClient.put).toHaveBeenCalledWith('/api/admin/inmuebles/7/operaciones', op)
  })
})
