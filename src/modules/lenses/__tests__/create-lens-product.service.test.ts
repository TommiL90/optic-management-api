
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConflictException } from '@/core/errors/app-errors'
import { InMemoryLensesRepository } from '../repositories/in-memory-lenses.repository'
import { LensesService } from '../lenses.service'
import type { CreateLensProduct } from '../schemas/lenses.schemas'

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

describe('Create Lens Product Service', () => {
  beforeEach(() => {
    lensesRepository = new InMemoryLensesRepository()
    lensesService = new LensesService(lensesRepository)
  })

  it('should create a new lens product successfully', async () => {
    const range = lensesRepository.addPrescriptionRange({
      code: '42-42',
      description: 'Test Range',
      odMaxSphere: 4,
      odMaxCylinder: 2,
      oiMaxSphere: 4,
      oiMaxCylinder: 2,
    })

    const productData: CreateLensProduct = {
      sku: 'TEST-SKU-1',
      name: 'Test Lens',
      material: 'organico',
      tipo: 'monofocal',
      frameType: 'cerrado',
      hasAntiReflective: true,
      hasBlueFilter: false,
      isPhotochromic: false,
      hasUVProtection: true,
      isPolarized: false,
      isMirrored: false,
      basePrice: 100,
      finalPrice: 200,
      deliveryDays: 3,
      prescriptionRangeId: range.id,
      available: true,
    }

    const product = await lensesService.createLensProduct(productData)

		expect(product.id).toEqual(expect.any(String))
          expect(product.sku).toBe('TEST-SKU-1')
          expect(lensesRepository.lensProducts[0].name).toBe('Test Lens')  })

  it('should throw ConflictException if SKU already exists', async () => {
    const range = lensesRepository.addPrescriptionRange({
      code: '42-42',
      description: 'Test Range',
      odMaxSphere: 4,
      odMaxCylinder: 2,
      oiMaxSphere: 4,
      oiMaxCylinder: 2,
    })

    const productData: CreateLensProduct = {
      sku: 'DUPLICATE-SKU',
      name: 'Original Lens',
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
      prescriptionRangeId: range.id,
      available: true,
    }

    await lensesService.createLensProduct(productData)

    const duplicateProductData = { ...productData, name: 'Duplicate Lens' }

    await expect(
      lensesService.createLensProduct(duplicateProductData)
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
