
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConflictException, NotFoundException } from '@/core/errors/app-errors'
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

describe('Update Lens Product Service', () => {
  beforeEach(() => {
    lensesRepository = new InMemoryLensesRepository()
    lensesService = new LensesService(lensesRepository)
  })

  it('should update a lens product successfully', async () => {
    const createdProduct = await lensesRepository.create({
      sku: 'UPDATE-ME',
      name: 'Original Name',
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

		const updatedProduct = await lensesService.updateLensProduct(createdProduct.id, {      name: 'Updated Name',
      finalPrice: 250,
    })

    expect(updatedProduct.name).toBe('Updated Name')
    expect(updatedProduct.pricing.finalPrice).toBe(250)
    expect(lensesRepository.lensProducts[0].name).toBe('Updated Name')
  })

  it('should throw NotFoundException if product to update does not exist', async () => {
    await expect(
      lensesService.updateLensProduct('NON-EXISTENT-ID', { name: 'New Name' })
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('should throw ConflictException if updating SKU to an already existing one', async () => {
    await lensesRepository.create({ sku: 'SKU-A', name: 'Lens A', material: 'organico', tipo: 'monofocal', frameType: 'cerrado', hasAntiReflective: false, hasBlueFilter: false, isPhotochromic: false, hasUVProtection: true, isPolarized: false, isMirrored: false, basePrice: 100, finalPrice: 200, deliveryDays: 3, prescriptionRangeId: 'range-1', available: true })
    const product2 = await lensesRepository.create({ sku: 'SKU-B', name: 'Lens B', material: 'organico', tipo: 'monofocal', frameType: 'cerrado', hasAntiReflective: false, hasBlueFilter: false, isPhotochromic: false, hasUVProtection: true, isPolarized: false, isMirrored: false, basePrice: 100, finalPrice: 200, deliveryDays: 3, prescriptionRangeId: 'range-1', available: true })

		await expect(
			lensesService.updateLensProduct(product2.id, { sku: 'SKU-A' })
		).rejects.toBeInstanceOf(ConflictException)  })

  it('should preserve unchanged fields during update', async () => {
    const originalProduct = await lensesRepository.create({
      sku: 'PRESERVE-ME',
      name: 'Original Name',
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

		const updatedProduct = await lensesService.updateLensProduct(originalProduct.id, {
        name: 'Updated Name',
      })

    // Verificar que los campos modificados cambiaron
    expect(updatedProduct.name).toBe('Updated Name')
    expect(updatedProduct.pricing.finalPrice).toBe(200)

    // Verificar que los campos no modificados se preservaron
    expect(updatedProduct.material).toBe('organico')
    expect(updatedProduct.tipo).toBe('monofocal')
    expect(updatedProduct.frameType).toBe('cerrado')
    expect(updatedProduct.features.hasAntiReflective).toBe(false)
    expect(updatedProduct.features.hasBlueFilter).toBe(false)
    expect(updatedProduct.features.isPhotochromic).toBe(false)
    expect(updatedProduct.features.hasUVProtection).toBe(true)
    expect(updatedProduct.features.isPolarized).toBe(false)
    expect(updatedProduct.features.isMirrored).toBe(false)
    expect(updatedProduct.pricing.basePrice).toBe(100)
    expect(updatedProduct.deliveryDays).toBe(3)
    expect(updatedProduct.available).toBe(true)
    expect(updatedProduct.prescriptionRangeId).toBe('range-1')
    expect(updatedProduct.sku).toBe('PRESERVE-ME')
  })
})
