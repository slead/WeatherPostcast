import { describe, it, expect } from 'vitest'

describe('Vitest setup', () => {
  it('should run tests correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('should support path aliases', async () => {
    // This verifies the @/ alias is working
    const utils = await import('@/lib/utils')
    expect(utils.cn).toBeDefined()
  })
})
