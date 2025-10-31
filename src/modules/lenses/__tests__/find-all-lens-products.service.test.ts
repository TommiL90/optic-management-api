
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InMemoryLensesRepository } from '../repositories/in-memory-lenses.repository'
import { LensesService } from '../lenses.service'

// Mock the Logger
vi.mock('@/core/utils/logger.util', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    businessLogic: vi.fn(),
    databaseQuery: vi.fn(),
    initialize: vi.fn(),
  },
}))

let lensesRepository: InMemoryLensesRepository
let lensesService: LensesService

describe('Find All Lens Products Service', () => {
  beforeEach(() => {
    lensesRepository = new InMemoryLensesRepository()
    lensesService = new LensesService(lensesRepository)
  })

  it('should return all lens products', async () => {
    await lensesRepository.create({ sku: 'SKU1', name: 'Lens 1', material: 'organico', tipo: 'monofocal', frameType: 'cerrado', hasAntiReflective: false, hasBlueFilter: false, isPhotochromic: false, hasUVProtection: true, isPolarized: false, isMirrored: false, basePrice: 100, finalPrice: 200, deliveryDays: 3, prescriptionRangeId: 'range-1', available: true })
    await lensesRepository.create({ sku: 'SKU2', name: 'Lens 2', material: 'policarbonato', tipo: 'bifocal', frameType: 'al_aire', hasAntiReflective: true, hasBlueFilter: true, isPhotochromic: false, hasUVProtection: true, isPolarized: false, isMirrored: false, basePrice: 150, finalPrice: 250, deliveryDays: 5, prescriptionRangeId: 'range-2', available: true })

    const result = await lensesService.findAllLensProducts()

    expect(result.products).toHaveLength(2)
    expect(result.products.some(p => p.name === 'Lens 1')).toBe(true)
    expect(result.products.some(p => p.name === 'Lens 2')).toBe(true)
  })

  it('should return an empty array if no products exist', async () => {
    const result = await lensesService.findAllLensProducts()
    expect(result.products).toHaveLength(0)
  })
})
