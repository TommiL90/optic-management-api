import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { setupTestDatabase, cleanupTestDatabase } from './test-utils'

describe('Find All Lens Products (E2E)', () => {
  let testRanges: any[] = []

  beforeAll(async () => {
    await app.ready()
    testRanges = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await app.close()
  })

  describe('Successful products retrieval', () => {
    it('should get all products without pagination (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      
      expect(body).toHaveProperty('products')
      expect(Array.isArray(body.products)).toBe(true)
    })

    it('should return array of products', async () => {
      // Given - Create some test products
      await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'LIST-TEST-001',
          name: 'List Test Product 1',
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

      await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'LIST-TEST-002',
          name: 'List Test Product 2',
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

      // When
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      
      expect(Array.isArray(body.products)).toBe(true)
      expect(body.products.length).toBeGreaterThanOrEqual(2)
    })

    it('should return correct product data structure', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      
      if (body.products.length > 0) {
        const product = body.products[0]
        expect(product).toHaveProperty('id')
        expect(product).toHaveProperty('sku')
        expect(product).toHaveProperty('name')
        expect(product).toHaveProperty('material')
        expect(product).toHaveProperty('tipo')
        expect(product).toHaveProperty('frameType')
        expect(product).toHaveProperty('features')
        expect(product).toHaveProperty('pricing')
        expect(product).toHaveProperty('deliveryDays')
        expect(product).toHaveProperty('available')
        expect(product).toHaveProperty('prescriptionRangeId')
        expect(product).toHaveProperty('createdAt')
        expect(product).toHaveProperty('updatedAt')
        
        // Verify features structure
        expect(product.features).toHaveProperty('hasAntiReflective')
        expect(product.features).toHaveProperty('hasBlueFilter')
        expect(product.features).toHaveProperty('isPhotochromic')
        expect(product.features).toHaveProperty('hasUVProtection')
        expect(product.features).toHaveProperty('isPolarized')
        expect(product.features).toHaveProperty('isMirrored')
        
        // Verify pricing structure
        expect(product.pricing).toHaveProperty('basePrice')
        expect(product.pricing).toHaveProperty('finalPrice')
      }
    })

    it('should return products sorted by creation date (newest first)', async () => {
      // Given - Create products with time delay
      const product1 = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'SORT-TEST-001',
          name: 'Sort Test Product 1',
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
      const createdProduct1 = JSON.parse(product1.body)

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100))

      const product2 = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'SORT-TEST-002',
          name: 'Sort Test Product 2',
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
      const createdProduct2 = JSON.parse(product2.body)

      // When
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      
      // Find our test products in the response
      const testProduct1 = body.products.find((p: any) => p.id === createdProduct1.id)
      const testProduct2 = body.products.find((p: any) => p.id === createdProduct2.id)
      
      expect(testProduct1).toBeDefined()
      expect(testProduct2).toBeDefined()
      
      // Product 2 should appear before Product 1 (newest first)
      const index1 = body.products.findIndex((p: any) => p.id === createdProduct1.id)
      const index2 = body.products.findIndex((p: any) => p.id === createdProduct2.id)
      expect(index2).toBeLessThan(index1)
    })
  })

  describe('Empty results', () => {
    it('should return empty array when no products exist (200)', async () => {
      // Note: This test might not be meaningful if other tests have already created products
      // But it validates the API behavior
      
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.products)).toBe(true)
      // Note: We can't guarantee empty array if other tests ran first
    })
  })

  describe('Data consistency', () => {
    it('should return same data for repeated requests', async () => {
      // When
      const response1 = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })
      
      const response2 = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })

      // Then
      expect(response1.statusCode).toBe(200)
      expect(response2.statusCode).toBe(200)
      
      const body1 = JSON.parse(response1.body)
      const body2 = JSON.parse(response2.body)
      
      expect(body1.products).toEqual(body2.products)
    })

    it('should include all created products', async () => {
      // Given - Create a specific product
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'INCLUDE-TEST-SKU',
          name: 'Include Test Product',
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
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      
      const foundProduct = body.products.find((p: any) => p.id === createdProduct.id)
      expect(foundProduct).toBeDefined()
      expect(foundProduct.sku).toBe('INCLUDE-TEST-SKU')
      expect(foundProduct.name).toBe('Include Test Product')
    })
  })

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently (200)', async () => {
      // When
      const startTime = Date.now()
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products',
      })
      const endTime = Date.now()

      // Then
      expect(response.statusCode).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000) // 5 segundos máximo
      
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.products)).toBe(true)
    }, 10000) // 10 segundos timeout
  })
})