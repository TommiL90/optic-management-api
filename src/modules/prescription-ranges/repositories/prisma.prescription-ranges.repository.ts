import { prisma } from '@/core/database/prisma.client.ts'
import { Logger } from '@/core/utils/logger.util.ts'
import type { IPrescriptionRangesRepository } from '@/modules/prescription-ranges/repositories/prescription-ranges.repository.interface.ts'
import type { PrescriptionRangeData } from '@/modules/lenses/schemas/lenses.schemas.ts'

export class PrismaPrescriptionRangesRepository implements IPrescriptionRangesRepository {
	/**
	 * Get all prescription ranges ordered by code
	 * @returns Promise with array of prescription ranges
	 */
	async findAll(): Promise<PrescriptionRangeData[]> {
		Logger.debug('PrismaPrescriptionRangesRepository: findAll started', {
			operation: 'findAll',
			table: 'prescriptionRange',
		})

		try {
			const ranges = await prisma.prescriptionRange.findMany({
				orderBy: {
					code: 'asc',
				},
			})

			Logger.debug('PrismaPrescriptionRangesRepository: findAll completed', {
				operation: 'findAll',
				table: 'prescriptionRange',
				result: { count: ranges.length },
			})

			return ranges
		} catch (error) {
			Logger.error('PrismaPrescriptionRangesRepository: findAll failed', {
				operation: 'findAll',
				table: 'prescriptionRange',
				error: error instanceof Error ? error.message : String(error),
			})
			throw error
		}
	}
}
