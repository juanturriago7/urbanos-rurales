import { describe, expect, it } from 'vitest'

describe('infraestructura de tests', () => {
  it('corre y resuelve el alias @', async () => {
    const modulo = await import('@/shared/lib/axios')
    expect(modulo.apiClient).toBeDefined()
  })
})
