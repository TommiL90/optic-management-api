import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { setupTestDatabase, cleanupTestDatabase } from './test-utils'

describe('Quote Lenses (E2E)', () => {
  let testRanges: any[] = []

  beforeAll(async () => {
    await app.ready()
    testRanges = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await app.close()
  })

  describe('Successful quote with valid prescription', () => {
    it('should quote lenses with basic prescription (200)', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('results')
      expect(body).toHaveProperty('meta')
      expect(Array.isArray(body.results)).toBe(true)
      expect(body.meta).toHaveProperty('originalPrescription')
      expect(body.meta).toHaveProperty('normalizedPrescription')
      expect(body.meta).toHaveProperty('prescriptionRangeUsed')
    })

    it('should normalize prescription values to 0.25 increments', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.76, cylinder: -1.49 },
          oi: { sphere: -4.01, cylinder: -2.01 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.meta.normalizedPrescription.od.sphere).toBe(-3.75)
      expect(body.meta.normalizedPrescription.od.cylinder).toBe(-1.50)
      expect(body.meta.normalizedPrescription.oi.sphere).toBe(-4.00)
      expect(body.meta.normalizedPrescription.oi.cylinder).toBe(-2.00)
    })

    it('should return products ordered by finalPrice (asc)', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      if (body.results.length > 1) {
        for (let i = 1; i < body.results.length; i++) {
          expect(body.results[i].pricing.finalPrice).toBeGreaterThanOrEqual(
            body.results[i - 1].pricing.finalPrice
          )
        }
      }
    })

    it('should filter by frameType correctly', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      body.results.forEach((product: any) => {
        expect(product.frameType).toBe('cerrado')
      })
    })
  })

  describe('Prescription normalization', () => {
    it('should normalize -3.76 to -3.75', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.76, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.meta.normalizedPrescription.od.sphere).toBe(-3.75)
    })

    it('should normalize 2.13 to 2.25', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: 2.13, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.meta.normalizedPrescription.od.sphere).toBe(2.25)
    })

    it('should keep already normalized values', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.meta.normalizedPrescription.od.sphere).toBe(-3.75)
      expect(body.meta.normalizedPrescription.od.cylinder).toBe(-1.50)
      expect(body.meta.normalizedPrescription.oi.sphere).toBe(-4.00)
      expect(body.meta.normalizedPrescription.oi.cylinder).toBe(-2.00)
    })
  })

  describe('Range selection', () => {
    it('should select correct range for 4/2 - 4/2 prescription', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -4.00, cylinder: -2.00 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.meta.prescriptionRangeUsed.code).toBe('42-42')
    })

    it('should select correct range for mixed prescriptions (4/2 - 4/4)', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -4.00, cylinder: -2.00 },
          oi: { sphere: -4.00, cylinder: -4.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.meta.prescriptionRangeUsed.code).toBe('44-44')
    })

    it('should select smallest range that covers prescription', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.00, cylinder: -1.50 },
          oi: { sphere: -3.00, cylinder: -1.50 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.meta.prescriptionRangeUsed.code).toBe('42-42')
    })
  })

  describe('Filtering', () => {
    it('should filter by optional material', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
          material: 'organico',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      body.results.forEach((product: any) => {
        expect(product.material).toBe('organico')
      })
    })

    it('should filter by optional features (hasBlueFilter)', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
          hasBlueFilter: true,
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      body.results.forEach((product: any) => {
        expect(product.features.hasBlueFilter).toBe(true)
      })
    })

    it('should filter by optional features (isPhotochromic)', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
          isPhotochromic: true,
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      body.results.forEach((product: any) => {
        expect(product.features.isPhotochromic).toBe(true)
      })
    })

    it('should combine multiple filters', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
          material: 'organico',
          hasBlueFilter: true,
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      body.results.forEach((product: any) => {
        expect(product.frameType).toBe('cerrado')
        expect(product.material).toBe('organico')
        expect(product.features.hasBlueFilter).toBe(true)
      })
    })
  })

  describe('Error handling', () => {
    it('should return 404 when no range covers prescription', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -10.00, cylinder: -5.00 },
          oi: { sphere: -10.00, cylinder: -5.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error.message.toLowerCase()).toContain('no se encontró una tabla de precios')
    })

    it('should return 400 with missing frameType', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {},
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(400)
    })

    it('should return 400 with invalid prescription values', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: 'invalid', cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(400)
    })

    it('should return empty results when no products match filters (200)', async () => {
      // Given
      const requestBody = {
        prescription: {
          od: { sphere: -3.75, cylinder: -1.50 },
          oi: { sphere: -4.00, cylinder: -2.00 },
        },
        filters: {
          frameType: 'cerrado',
          material: 'policarbonato', // Assuming no products with this material exist
        },
      }

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/lenses/quote',
        payload: requestBody,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.results).toHaveLength(0)
    })
  })
})