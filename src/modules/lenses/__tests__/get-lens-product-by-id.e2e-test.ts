import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { setupTestDatabase, cleanupTestDatabase } from './test-utils'

describe('Get Lens Product By ID (E2E)', () => {
  let testRanges: any[] = []

  beforeAll(async () => {
    await app.ready()
    testRanges = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await app.close()
  })

  describe('Successful product retrieval', () => {
    it('should get product by valid ID (200)', async () => {
      // Given - Create a product first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'GET-TEST-SKU',
          name: 'Get Test Product',
          material: 'organico',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: true,
          hasBlueFilter: false,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: false,
          basePrice: 1500,
          finalPrice: 3000,
          deliveryDays: 4,
          observations: 'Test product for GET',
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(createdProduct.id)
      expect(body.sku).toBe('GET-TEST-SKU')
      expect(body.name).toBe('Get Test Product')
      expect(body.material).toBe('organico')
      expect(body.tipo).toBe('monofocal')
      expect(body.frameType).toBe('cerrado')
      expect(body.features).toEqual({
        hasAntiReflective: true,
        hasBlueFilter: false,
        isPhotochromic: false,
        hasUVProtection: true,
        isPolarized: false,
        isMirrored: false,
      })
      expect(body.pricing).toEqual({
        basePrice: 1500,
        finalPrice: 3000,
      })
      expect(body.deliveryDays).toBe(4)
      expect(body.observations).toBe('Test product for GET')
      expect(body.available).toBe(true)
      expect(body.prescriptionRangeId).toBe(testRanges[0].id)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    it('should return correct product data structure', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'STRUCTURE-TEST-SKU',
          name: 'Structure Test Product',
          material: 'policarbonato',
          tipo: 'bifocal',
          frameType: 'semicerrado',
          hasAntiReflective: false,
          hasBlueFilter: true,
          isPhotochromic: true,
          hasUVProtection: true,
          isPolarized: true,
          isMirrored: false,
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
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual({
        id: expect.any(String),
        sku: expect.any(String),
        name: expect.any(String),
        material: expect.any(String),
        tipo: expect.any(String),
        frameType: expect.any(String),
        features: {
          hasAntiReflective: expect.any(Boolean),
          hasBlueFilter: expect.any(Boolean),
          isPhotochromic: expect.any(Boolean),
          hasUVProtection: expect.any(Boolean),
          isPolarized: expect.any(Boolean),
          isMirrored: expect.any(Boolean),
        },
        pricing: {
          basePrice: expect.any(Number),
          finalPrice: expect.any(Number),
        },
        deliveryDays: expect.any(Number),
        observations: null,
        available: expect.any(Boolean),
        prescriptionRangeId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('should return dates in ISO format', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'DATE-TEST-SKU',
          name: 'Date Test Product',
          material: 'mineral',
          tipo: 'multifocal',
          frameType: 'al_aire',
          hasAntiReflective: true,
          hasBlueFilter: true,
          isPhotochromic: false,
          hasUVProtection: true,
          isPolarized: false,
          isMirrored: true,
          basePrice: 3000,
          finalPrice: 6000,
          deliveryDays: 7,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(() => new Date(body.createdAt)).not.toThrow()
      expect(() => new Date(body.updatedAt)).not.toThrow()
    })

    it('should return nested features and pricing objects', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          sku: 'NESTED-TEST-SKU',
          name: 'Nested Test Product',
          material: 'adelgazado',
          tipo: 'monofocal',
          frameType: 'cerrado',
          hasAntiReflective: true,
          hasBlueFilter: true,
          isPhotochromic: true,
          hasUVProtection: true,
          isPolarized: true,
          isMirrored: true,
          basePrice: 1000,
          finalPrice: 2000,
          deliveryDays: 3,
          available: true,
          prescriptionRangeId: testRanges[0].id,
        },
      })
      const createdProduct = JSON.parse(createResponse.body)

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/lenses/products/${createdProduct.id}`,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      
      // Verify features object structure
      expect(body.features).toBeDefined()
      expect(typeof body.features.hasAntiReflective).toBe('boolean')
      expect(typeof body.features.hasBlueFilter).toBe('boolean')
      expect(typeof body.features.isPhotochromic).toBe('boolean')
      expect(typeof body.features.hasUVProtection).toBe('boolean')
      expect(typeof body.features.isPolarized).toBe('boolean')
      expect(typeof body.features.isMirrored).toBe('boolean')
      
      // Verify pricing object structure
      expect(body.pricing).toBeDefined()
      expect(typeof body.pricing.basePrice).toBe('number')
      expect(typeof body.pricing.finalPrice).toBe('number')
    })
  })

  describe('Error handling', () => {
    it('should return 404 with non-existent ID', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      // When
      const response = await app.inject({
        method: 'GET',
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
        method: 'GET',
        url: `/lenses/products/${invalidId}`,
      })

      // Then
      expect(response.statusCode).toBe(400)
    })

    it('should return 400 with empty ID', async () => {
      // Given - empty string as ID

      // When
      const response = await app.inject({
        method: 'GET',
        url: '/lenses/products/ ',
      })

      // Then
      expect(response.statusCode).toBe(400) // Invalid UUID format
    })
  })
})