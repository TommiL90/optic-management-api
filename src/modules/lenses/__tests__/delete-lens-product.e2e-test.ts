import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { setupTestDatabase, cleanupTestDatabase } from './test-utils'

describe('Delete Lens Product (E2E)', () => {
  let testRanges: any[] = []

  beforeAll(async () => {
    await app.ready()
    testRanges = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await app.close()
  })

  describe('Successful product deletion', () => {
    it('should delete product successfully (204)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'DELETE-TEST-SKU',
          name: 'Delete Test Product',
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
          observations: 'Test product for deletion',
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then
      expect(response.statusCode).toBe(204)
      expect(response.body).toBe('')
    })

    it('should not return content', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'NO-CONTENT-TEST-SKU',
          name: 'No Content Test Product',
          material: 'policarbonato',
          tipo: 'bifocal',
          frameType: 'semicerrado',
          hasAntiReflective: true,
          hasBlueFilter: true,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1500,
          finalPrice: 3000,
          deliveryDays: 4,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then
      expect(response.statusCode).toBe(204)
      expect(response.body).toBe('')
      expect(response.headers['content-type']).toBeUndefined()
    })

    it('should confirm deletion (404 on subsequent GET)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'CONFIRM-DELETE-SKU',
          name: 'Confirm Delete Product',
          material: 'mineral',
          tipo: 'multifocal',
          frameType: 'al_aire',
          hasAntiReflective: true,
          hasBlueFilter: true,
          isPhotochromic: true,
          hasUVProtection: true,
          isPolarized: true,
          isMirrored: true,
          basePrice: 2000,
          finalPrice: 4000,
          deliveryDays: 5,
          observations: 'Product to confirm deletion',
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When - Delete the product
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then - Verify deletion was successful
      expect(deleteResponse.statusCode).toBe(204)

      // When - Try to get the deleted product
      const getResponse = await app.inject({
        method: 'GET',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then - Should return 404
      expect(getResponse.statusCode).toBe(404)
      const body = JSON.parse(getResponse.body)
      expect(body.error.message.toLowerCase()).toContain('not found')
    })

    it('should remove product from list after deletion', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'LIST-REMOVAL-SKU',
          name: 'List Removal Product',
          material: 'adelgazado',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: false,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: false,
          isPolarized: false,
          isMirrored: false,
          basePrice: 500,
          finalPrice: 1000,
          deliveryDays: 2,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When - Get products list before deletion
      const beforeDeleteResponse = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })
      const beforeDeleteBody = JSON.parse(beforeDeleteResponse.body)
      const beforeDeleteCount = beforeDeleteBody.products.length

      // Delete the product
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Get products list after deletion
      const afterDeleteResponse = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })
      const afterDeleteBody = JSON.parse(afterDeleteResponse.body)
      const afterDeleteCount = afterDeleteBody.products.length

      // Then
      expect(deleteResponse.statusCode).toBe(204)
      expect(afterDeleteCount).toBe(beforeDeleteCount - 1)
      
      // Verify the deleted product is not in the list
      const deletedProduct = afterDeleteBody.products.find((p: any) => p.id === createdProduct.id)
      expect(deletedProduct).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should return 404 with non-existent ID', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/lenses/products/${nonExistentId}`,
      })

      // Then
      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error.message.toLowerCase()).toContain('not found')
    })

    it('should return 400 with invalid UUID format', async () => {
      // Given
      const invalidId = 'not-a-valid-uuid'

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/lenses/products/${invalidId}`,
      })

      // Then
      expect(response.statusCode).toBe(400)
    })

    it('should return 400 with empty ID', async () => {
      // Given - empty string as ID

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: '/lenses/products/ ',
      })

      // Then
      expect(response.statusCode).toBe(400) // Invalid UUID format
    })
  })

  describe('Data integrity', () => {
    it('should not affect other products when deleting one', async () => {
      // Given - Create multiple products
      const product1Response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'INTEGRITY-TEST-1',
          name: 'Integrity Test Product 1',
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
      const product1 = JSON.parse(product1Response.body)

      const product2Response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'INTEGRITY-TEST-2',
          name: 'Integrity Test Product 2',
          material: 'policarbonato',
          tipo: 'bifocal',
          frameType: 'semicerrado',
          hasAntiReflective: true,
          hasBlueFilter: true,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1500,
          finalPrice: 3000,
          deliveryDays: 4,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const product2 = JSON.parse(product2Response.body)

      // When - Delete only product1
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/lenses/products/${product1.id}`,
      })

      // Then - Verify product1 is deleted
      expect(deleteResponse.statusCode).toBe(204)

      // Verify product1 is deleted
      const getProduct1Response = await app.inject({
        method: 'GET',
        url: `/lenses/products/${product1.id}`,
      })
      expect(getProduct1Response.statusCode).toBe(404)

      // Verify product2 still exists
      const getProduct2Response = await app.inject({
        method: 'GET',
        url: `/lenses/products/${product2.id}`,
      })
      expect(getProduct2Response.statusCode).toBe(200)
      const product2Body = JSON.parse(getProduct2Response.body)
      expect(product2Body.id).toBe(product2.id)
      expect(product2Body.sku).toBe('INTEGRITY-TEST-2')
      expect(product2Body.name).toBe('Integrity Test Product 2')
    })
  })
})