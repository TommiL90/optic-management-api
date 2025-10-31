
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundException } from '@/core/errors/app-errors'
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

describe('Find Lens Product By ID Service', () => {
  beforeEach(() => {
    lensesRepository = new InMemoryLensesRepository()
    lensesService = new LensesService(lensesRepository)
  })

  it('should find a lens product by its ID', async () => {
    const createdProduct = await lensesRepository.create({
      sku: 'FIND-ME',
      name: 'Find Me Lens',
      material: 'organico',
      tipo: 'monofocal',
      frameType: 'cerrado',
      hasAntiReflective: false,
      hasBlueFilter: false,
      isPhotochromic: false,
      hasUVProtection: true,
      isPolarized: false,
      isMirrored: false,
      basePrice: 100,
      finalPrice: 200,
      deliveryDays: 3,
      prescriptionRangeId: 'range-1',
      available: true,
    })

		const foundProduct = await lensesService.findLensProductById(createdProduct.id)
    
		expect(foundProduct).toBeDefined()
		expect(foundProduct.id).toBe(createdProduct.id)
		expect(foundProduct.name).toBe('Find Me Lens')
  })

  it('should throw NotFoundException if product ID does not exist', async () => {
    await expect(
      lensesService.findLensProductById('NON-EXISTENT-ID')
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
