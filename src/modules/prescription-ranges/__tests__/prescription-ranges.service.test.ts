import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrescriptionRangesService } from '@/modules/prescription-ranges/prescription-ranges.service.ts'
import type { IPrescriptionRangesRepository } from '@/modules/prescription-ranges/repositories/prescription-ranges.repository.interface.ts'
import type { PrescriptionRangeData } from '@/modules/lenses/schemas/lenses.schemas.ts'

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

/**
 * In-memory implementation for testing
 */
class InMemoryPrescriptionRangesRepository implements IPrescriptionRangesRepository {
	private ranges: PrescriptionRangeData[] = []

	constructor(initialRanges: PrescriptionRangeData[] = []) {
		this.ranges = initialRanges
	}

	async findAll(): Promise<PrescriptionRangeData[]> {
		return this.ranges
	}
}

describe('PrescriptionRangesService', () => {
	let prescriptionRangesService: PrescriptionRangesService
	let prescriptionRangesRepository: InMemoryPrescriptionRangesRepository

	beforeEach(() => {
		prescriptionRangesRepository = new InMemoryPrescriptionRangesRepository()
		prescriptionRangesService = new PrescriptionRangesService(prescriptionRangesRepository)
	})

	describe('findAllRanges', () => {
		it('should return empty array when no ranges exist', async () => {
			// Given
			// No ranges in repository

			// When
			const result = await prescriptionRangesService.findAllRanges()

			// Then
			expect(result).toEqual({ ranges: [] })
		})

		it('should return all prescription ranges', async () => {
			// Given
			const mockRanges: PrescriptionRangeData[] = [
				{
					id: 'range-1',
					code: '42-42',
					description: 'Ambos ojos hasta 4 esf / 2 cyl',
					minEyeMaxSphere: 4.0,
					minEyeMaxCylinder: 2.0,
					maxEyeMaxSphere: 4.0,
					maxEyeMaxCylinder: 2.0,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01'),
				},
				{
					id: 'range-2',
					code: '42-44',
					description: 'Un ojo hasta 4/2, otro ojo hasta 4/4',
					minEyeMaxSphere: 4.0,
					minEyeMaxCylinder: 2.0,
					maxEyeMaxSphere: 4.0,
					maxEyeMaxCylinder: 4.0,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01'),
				},
			]

			prescriptionRangesRepository = new InMemoryPrescriptionRangesRepository(mockRanges)
			prescriptionRangesService = new PrescriptionRangesService(prescriptionRangesRepository)

			// When
			const result = await prescriptionRangesService.findAllRanges()

			// Then
			expect(result.ranges).toHaveLength(2)
			expect(result.ranges[0].id).toBe('range-1')
			expect(result.ranges[0].code).toBe('42-42')
			expect(result.ranges[1].id).toBe('range-2')
			expect(result.ranges[1].code).toBe('42-44')
		})

		it('should return ranges with correct structure', async () => {
			// Given
			const mockRanges: PrescriptionRangeData[] = [
				{
					id: 'range-1',
					code: '42-42',
					description: 'Ambos ojos hasta 4 esf / 2 cyl',
					minEyeMaxSphere: 4.0,
					minEyeMaxCylinder: 2.0,
					maxEyeMaxSphere: 4.0,
					maxEyeMaxCylinder: 2.0,
					createdAt: new Date('2024-01-01T10:00:00Z'),
					updatedAt: new Date('2024-01-02T15:30:00Z'),
				},
			]

			prescriptionRangesRepository = new InMemoryPrescriptionRangesRepository(mockRanges)
			prescriptionRangesService = new PrescriptionRangesService(prescriptionRangesRepository)

			// When
			const result = await prescriptionRangesService.findAllRanges()

			// Then
			const range = result.ranges[0]
			expect(range).toEqual({
				id: 'range-1',
				code: '42-42',
				description: 'Ambos ojos hasta 4 esf / 2 cyl',
				minEyeMaxSphere: 4.0,
				minEyeMaxCylinder: 2.0,
				maxEyeMaxSphere: 4.0,
				maxEyeMaxCylinder: 2.0,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			})
			expect(range.createdAt).toBe('2024-01-01T10:00:00.000Z')
			expect(range.updatedAt).toBe('2024-01-02T15:30:00.000Z')
		})
	})
})
