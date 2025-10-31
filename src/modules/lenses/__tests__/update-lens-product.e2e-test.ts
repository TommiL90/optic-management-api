import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { setupTestDatabase, cleanupTestDatabase } from './test-utils'

describe('Update Lens Product (E2E)', () => {
  let testRanges: any[] = []

  beforeAll(async () => {
    await app.ready()
    testRanges = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await app.close()
  })

  describe('Successful product update', () => {
    it('should update product with valid data (200)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'UPDATE-TEST-SKU',
          name: 'Update Test Product',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          observations: 'Original observations',
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When
      const updateData = {
        name: 'Updated Product Name',
        material: 'policarbonato',
        hasAntiReflective: true,
        hasBlueFilter: true,
        basePrice: 1500,
        finalPrice: 3000,
        deliveryDays: 5,
        observations: 'Updated observations',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${createdProduct.id}`,
        payload: updateData,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(createdProduct.id)
      expect(body.sku).toBe('UPDATE-TEST-SKU') // SKU should not change
      expect(body.name).toBe('Updated Product Name')
      expect(body.material).toBe('policarbonato')
      expect(body.tipo).toBe('monofocal') // Should not change
      expect(body.frameType).toBe('cerrado') // Should not change
      expect(body.features.hasAntiReflective).toBe(true)
      expect(body.features.hasBlueFilter).toBe(true)
      expect(body.features.isPhotochromic).toBe(false) // Should not change
      expect(body.pricing.basePrice).toBe(1500)
      expect(body.pricing.finalPrice).toBe(3000)
      expect(body.deliveryDays).toBe(5)
      expect(body.observations).toBe('Updated observations')
      expect(body.available).toBe(true) // Should not change
      expect(body.prescriptionRangeId).toBe(testRanges[0].id) // Should not change
    })

    it('should update only provided fields (partial update)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'PARTIAL-UPDATE-SKU',
          name: 'Partial Update Product',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When - Update only name and finalPrice
      const updateData = {
        name: 'Partially Updated Product',
        finalPrice: 2500,
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${createdProduct.id}`,
        payload: updateData,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('Partially Updated Product')
      expect(body.pricing.finalPrice).toBe(2500)
      // Other fields should remain unchanged
      expect(body.material).toBe('organico')
      expect(body.tipo).toBe('monofocal')
      expect(body.frameType).toBe('cerrado')
      expect(body.pricing.basePrice).toBe(1000) // Should not change
      expect(body.deliveryDays).toBe(3) // Should not change
    })

    it('should preserve unchanged fields', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'PRESERVE-TEST-SKU',
          name: 'Preserve Test Product',
          material: 'mineral',
          tipo: 'bifocal',
          frameType: 'semicerrado',
          hasAntiReflective: true,
          hasBlueFilter: true,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 2000,
          finalPrice: 4000,
          deliveryDays: 5,
          observations: 'Original observations',
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When - Update only name
      const updateData = {
        name: 'Name Only Updated',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${createdProduct.id}`,
        payload: updateData,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('Name Only Updated')
      
      // All other fields should be preserved
      expect(body.sku).toBe('PRESERVE-TEST-SKU')
      expect(body.material).toBe('mineral')
      expect(body.tipo).toBe('bifocal')
      expect(body.frameType).toBe('semicerrado')
      expect(body.features.hasAntiReflective).toBe(true)
      expect(body.features.hasBlueFilter).toBe(true)
      expect(body.features.isPhotochromic).toBe(false)
      expect(body.features.hasUVProtection).toBe(true)
      expect(body.features.isPolarized).toBe(false)
      expect(body.features.isMirrored).toBe(false)
      expect(body.pricing.basePrice).toBe(2000)
      expect(body.pricing.finalPrice).toBe(4000)
      expect(body.deliveryDays).toBe(5)
      expect(body.observations).toBe('Original observations')
      expect(body.available).toBe(true)
      expect(body.prescriptionRangeId).toBe(testRanges[0].id)
    })

    it('should update timestamps (updatedAt)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'TIMESTAMP-TEST-SKU',
          name: 'Timestamp Test Product',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)
      const originalUpdatedAt = createdProduct.updatedAt

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100))

      // When
      const updateData = {
        name: 'Updated Name',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${createdProduct.id}`,
        payload: updateData,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.createdAt).toBe(createdProduct.createdAt) // Should not change
      expect(body.updatedAt).not.toBe(originalUpdatedAt) // Should be updated
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime())
    })
  })

  describe('Validation errors', () => {
    it('should fail with duplicate SKU when updating (409)', async () => {
      // Given - Create two products
      const product1Response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'DUPLICATE-SKU-1',
          name: 'Product 1',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })

      const product2Response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'DUPLICATE-SKU-2',
          name: 'Product 2',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const product2 = JSON.parse(product2Response.body)

      // When - Try to update product2 with product1's SKU
      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${product2.id}`,
        payload: {
          sku: 'DUPLICATE-SKU-1',
        },
      })

      // Then
      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.body)
      expect(body.error.message.toLowerCase()).toContain('sku')
    })

    it('should fail with non-existent ID (404)', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      // When
      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${nonExistentId}`,
        payload: {
          name: 'Updated Name',
        },
      })

      // Then
      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error.message.toLowerCase()).toContain('not found')
    })

    it('should fail with invalid UUID format (400)', async () => {
      // Given
      const invalidId = 'not-a-valid-uuid'

      // When
      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${invalidId}`,
        payload: {
          name: 'Updated Name',
        },
      })

      // Then
      expect(response.statusCode).toBe(400)
    })

    it('should fail with invalid enum values (400)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'INVALID-ENUM-TEST',
          name: 'Invalid Enum Test',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When - Try to update with invalid material
      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${createdProduct.id}`,
        payload: {
          material: 'invalid-material',
        },
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('material')
    })

    it('should fail with negative prices (400)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'NEGATIVE-PRICE-TEST',
          name: 'Negative Price Test',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When - Try to update with negative prices
      const response = await app.inject({
        method: 'PUT',
        url: `/lenses/products/${createdProduct.id}`,
        payload: {
          basePrice: -1000,
          finalPrice: -2000,
        },
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('basePrice')
    })
  })
})