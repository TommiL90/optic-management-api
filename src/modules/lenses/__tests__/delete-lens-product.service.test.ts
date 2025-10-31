
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

describe('Delete Lens Product Service', () => {
  beforeEach(() => {
    lensesRepository = new InMemoryLensesRepository()
    lensesService = new LensesService(lensesRepository)
  })

  it('should delete a lens product successfully', async () => {
    const createdProduct = await lensesRepository.create({
      sku: 'DELETE-ME',
      name: 'Delete Me Lens',
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

    expect(lensesRepository.lensProducts).toHaveLength(1)

	await lensesService.deleteLensProduct(createdProduct.id)

    expect(lensesRepository.lensProducts).toHaveLength(0)
  })

  it('should throw NotFoundException if product to delete does not exist', async () => {
    await expect(
      lensesService.deleteLensProduct('NON-EXISTENT-ID')
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
