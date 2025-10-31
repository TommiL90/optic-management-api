import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { setupTestDatabase, cleanupTestDatabase } from './test-utils'

describe('Create Lens Product (E2E)', () => {
  let testRanges: any[] = []

  beforeAll(async () => {
    await app.ready()
    testRanges = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await app.close()
  })

  describe('Successful product creation', () => {
    it('should create product with valid data (201)', async () => {
      // Given
      const productData = {
        sku: 'TEST-SKU-001',
        name: 'Test Lens Product',
        material: 'organico',
        tipo: 'monofocal',
        frameType: 'cerrado',
        hasAntiReflective: true,
        hasBlueFilter: false,
        isPhotochromic: false,
        hasUVProtection: true,
        isPolarized: false,
        isMirrored: false,
        basePrice: 1000,
        finalPrice: 2000,
        deliveryDays: 3,
        observations: 'Test observations',
        available: true,
        prescriptionRangeId: testRanges[0].id,
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('id')
      expect(body.sku).toBe(productData.sku)
      expect(body.name).toBe(productData.name)
      expect(body.material).toBe(productData.material)
      expect(body.tipo).toBe(productData.tipo)
      expect(body.frameType).toBe(productData.frameType)
      expect(body.features).toEqual({
        hasAntiReflective: true,
        hasBlueFilter: false,
        isPhotochromic: false,
        hasUVProtection: true,
        isPolarized: false,
        isMirrored: false,
      })
      expect(body.pricing).toEqual({
        basePrice: 1000,
        finalPrice: 2000,
      })
      expect(body.deliveryDays).toBe(3)
      expect(body.observations).toBe('Test observations')
      expect(body.available).toBe(true)
      expect(body.prescriptionRangeId).toBe(testRanges[0].id)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    it('should not return costPrice in response (internal field)', async () => {
      // Given
      const productData = {
        sku: 'TEST-SKU-002',
        name: 'Test Lens Product 2',
        material: 'policarbonato',
        tipo: 'bifocal',
        frameType: 'semicerrado',
        hasAntiReflective: false,
        hasBlueFilter: true,
        isPhotochromic: true,
        hasUVProtection: true,
        isPolarized: false,
        isMirrored: false,
        basePrice: 1500,
        finalPrice: 3000,
        deliveryDays: 5,
        available: true,
        prescriptionRangeId: testRanges[0].id,
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).not.toHaveProperty('costPrice')
    })

    it('should return dates in ISO string format', async () => {
      // Given
      const productData = {
        sku: 'TEST-SKU-003',
        name: 'Test Lens Product 3',
        material: 'mineral',
        tipo: 'multifocal',
        frameType: 'al_aire',
        hasAntiReflective: true,
        hasBlueFilter: true,
        isPhotochromic: false,
        hasUVProtection: true,
        isPolarized: true,
        isMirrored: false,
        basePrice: 2000,
        finalPrice: 4000,
        deliveryDays: 7,
        available: true,
        prescriptionRangeId: testRanges[0].id,
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(() => new Date(body.createdAt)).not.toThrow()
      expect(() => new Date(body.updatedAt)).not.toThrow()
    })

    it('should return location header with new product URI', async () => {
      // Given
      const productData = {
        sku: 'TEST-SKU-004',
        name: 'Test Lens Product 4',
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
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(response.headers.location).toBe(`/lenses/products/${body.id}`)
    })
  })

  describe('Validation errors', () => {
    it('should fail with duplicate SKU (409)', async () => {
      // Given - Create first product
      const productData = {
        sku: 'DUPLICATE-SKU',
        name: 'First Product',
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
      }
      await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // When - Try to create second product with same SKU
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: {
          ...productData,
          name: 'Second Product',
        },
      })

      // Then
      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.body)
      expect(body.error.message.toLowerCase()).toContain('sku')
    })

    it('should fail with invalid material enum (400)', async () => {
      // Given
      const productData = {
        sku: 'INVALID-MATERIAL',
        name: 'Invalid Material Product',
        material: 'invalid-material',
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
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('material')
    })

    it('should fail with invalid tipo enum (400)', async () => {
      // Given
      const productData = {
        sku: 'INVALID-TIPO',
        name: 'Invalid Tipo Product',
        material: 'organico',
        tipo: 'invalid-tipo',
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
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('tipo')
    })

    it('should fail with invalid frameType enum (400)', async () => {
      // Given
      const productData = {
        sku: 'INVALID-FRAMETYPE',
        name: 'Invalid FrameType Product',
        material: 'organico',
        tipo: 'monofocal',
        frameType: 'invalid-frametype',
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
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('frameType')
    })

    it('should fail with missing required fields (400)', async () => {
      // Given
      const productData = {
        sku: 'MISSING-FIELDS',
        name: 'Missing Fields Product',
        // Missing required fields
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(400)
    })

    it('should fail with negative prices (400)', async () => {
      // Given
      const productData = {
        sku: 'NEGATIVE-PRICES',
        name: 'Negative Prices Product',
        material: 'organico',
        tipo: 'monofocal',
        frameType: 'cerrado',
        hasAntiReflective: false,
        hasBlueFilter: false,
        isPhotochromic: false,
        hasUVProtection: true,
        isPolarized: false,
        isMirrored: false,
        basePrice: -1000,
        finalPrice: -2000,
        deliveryDays: 3,
        available: true,
        prescriptionRangeId: testRanges[0].id,
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('basePrice')
    })

    it('should fail with negative deliveryDays (400)', async () => {
      // Given
      const productData = {
        sku: 'NEGATIVE-DELIVERY',
        name: 'Negative Delivery Product',
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
        deliveryDays: -3,
        available: true,
        prescriptionRangeId: testRanges[0].id,
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/products',
        payload: productData,
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('delivery')
    })
  })
})