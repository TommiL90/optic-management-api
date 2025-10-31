import { Logger } from '@/core/utils/logger.util.ts'
import type { IPrescriptionRangesRepository } from '@/modules/prescription-ranges/repositories/prescription-ranges.repository.interface.ts'
import type { PrescriptionRangesResponse } from '@/modules/prescription-ranges/schemas/prescription-ranges.schemas.ts'

/**
 * Prescription Ranges Service
 * Contains business logic for prescription ranges operations
 */
export class PrescriptionRangesService {
	constructor(private readonly prescriptionRangesRepository: IPrescriptionRangesRepository) {}

	/**
	 * Maps prescription range data to response format
	 * @param range - Prescription range data from repository
	 * @returns Prescription range response DTO
	 */
	private mapToResponse(range: any) {
		return {
			id: range.id,
			code: range.code,
			description: range.description,
			minEyeMaxSphere: range.minEyeMaxSphere,
			minEyeMaxCylinder: range.minEyeMaxCylinder,
			maxEyeMaxSphere: range.maxEyeMaxSphere,
			maxEyeMaxCylinder: range.maxEyeMaxCylinder,
			createdAt: range.createdAt.toISOString(),
			updatedAt: range.updatedAt.toISOString(),
		}
	}

	/**
	 * Get all prescription ranges
	 * @returns Promise with prescription ranges response
	 */
	async findAllRanges(): Promise<PrescriptionRangesResponse> {
		Logger.businessLogic('PrescriptionRangesService: findAllRanges started', {
			operation: 'findAllRanges',
		})

		try {
			const ranges = await this.prescriptionRangesRepository.findAll()
			const mappedRanges = ranges.map((range) => this.mapToResponse(range))

			Logger.businessLogic('PrescriptionRangesService: findAllRanges completed', {
				operation: 'findAllRanges',
				result: { count: mappedRanges.length },
			})

			return {
				ranges: mappedRanges,
			}
		} catch (error) {
			Logger.error('PrescriptionRangesService: findAllRanges failed', {
				operation: 'findAllRanges',
				error: error instanceof Error ? error.message : String(error),
			})
			throw error
		}
	}
}
