import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { app } from '@/app.ts'
import { setupTestDatabase, cleanupTestDatabase } from '@/modules/lenses/__tests__/test-utils.ts'

describe('Prescription Ranges Routes (E2E)', () => {
	beforeAll(async () => {
		await app.ready()
		await setupTestDatabase()
	})

	afterAll(async () => {
		await cleanupTestDatabase()
		await app.close()
	})

	describe('GET /prescription-ranges', () => {
		it('should return 200 and list of prescription ranges', async () => {
			// When
			const response = await app.inject({
				method: 'GET',
				url: '/prescription-ranges',
			})

			// Then
			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body).toHaveProperty('ranges')
			expect(Array.isArray(body.ranges)).toBe(true)
		})

		it('should return ranges with correct structure', async () => {
			// When
			const response = await app.inject({
				method: 'GET',
				url: '/prescription-ranges',
			})

			// Then
			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)

			if (body.ranges.length > 0) {
				const range = body.ranges[0]
				expect(range).toHaveProperty('id')
				expect(range).toHaveProperty('code')
				expect(range).toHaveProperty('description')
				expect(range).toHaveProperty('minEyeMaxSphere')
				expect(range).toHaveProperty('minEyeMaxCylinder')
				expect(range).toHaveProperty('maxEyeMaxSphere')
				expect(range).toHaveProperty('maxEyeMaxCylinder')
				expect(range).toHaveProperty('createdAt')
				expect(range).toHaveProperty('updatedAt')

				// Validate types
				expect(typeof range.id).toBe('string')
				expect(typeof range.code).toBe('string')
				expect(typeof range.description).toBe('string')
				expect(typeof range.minEyeMaxSphere).toBe('number')
				expect(typeof range.minEyeMaxCylinder).toBe('number')
				expect(typeof range.maxEyeMaxSphere).toBe('number')
				expect(typeof range.maxEyeMaxCylinder).toBe('number')
				expect(typeof range.createdAt).toBe('string')
				expect(typeof range.updatedAt).toBe('string')
			}
		})

		it('should return ranges ordered by code', async () => {
			// When
			const response = await app.inject({
				method: 'GET',
				url: '/prescription-ranges',
			})

			// Then
			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)

			if (body.ranges.length > 1) {
				const codes = body.ranges.map((r: any) => r.code)
				const sortedCodes = [...codes].sort()
				expect(codes).toEqual(sortedCodes)
			}
		})

		it('should return at least the test ranges created in setup', async () => {
			// When
			const response = await app.inject({
				method: 'GET',
				url: '/prescription-ranges',
			})

			// Then
			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)

			// Should have at least the 2 test ranges from setupTestDatabase
			expect(body.ranges.length).toBeGreaterThanOrEqual(2)

			// Should include the test ranges
			const codes = body.ranges.map((r: any) => r.code)
			expect(codes).toContain('42-42')
			expect(codes).toContain('44-44')
		})

		it('should have valid ISO datetime strings for createdAt and updatedAt', async () => {
			// When
			const response = await app.inject({
				method: 'GET',
				url: '/prescription-ranges',
			})

			// Then
			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)

			if (body.ranges.length > 0) {
				const range = body.ranges[0]

				// Should be valid ISO strings
				expect(() => new Date(range.createdAt)).not.toThrow()
				expect(() => new Date(range.updatedAt)).not.toThrow()

				// Should be in ISO format
				expect(range.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
				expect(range.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
			}
		})
	})
})
