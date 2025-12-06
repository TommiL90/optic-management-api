import { prisma } from '@/core/database/prisma.client.ts'
import { Logger } from '@/core/utils/logger.util.ts'
import type { IPrescriptionRangesRepository } from '@/modules/prescription-ranges/repositories/prescription-ranges.repository.interface.ts'
import type { PrescriptionRangeData } from '@/modules/lenses/schemas/lenses.schemas.ts'
import type { PrescriptionRangeInput } from '@/modules/prescription-ranges/schemas/prescription-ranges.schemas.ts'

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

	/**
	 * Seed prescription ranges (upsert by code)
	 * @param ranges - Array of prescription range data to seed
	 * @returns Promise with count of created and updated ranges
	 */
	async seedRanges(ranges: PrescriptionRangeInput[]): Promise<{ created: number; updated: number }> {
		Logger.debug('PrismaPrescriptionRangesRepository: seedRanges started', {
			operation: 'seedRanges',
			table: 'prescriptionRange',
			count: ranges.length,
		})

		try {
			let created = 0
			let updated = 0

			for (const rangeData of ranges) {
				const existing = await prisma.prescriptionRange.findUnique({
					where: { code: rangeData.code },
				})

				const result = await prisma.prescriptionRange.upsert({
					where: { code: rangeData.code },
					update: rangeData,
					create: rangeData,
				})

				if (existing) {
					updated++
				} else {
					created++
				}

				Logger.debug('PrismaPrescriptionRangesRepository: range processed', {
					operation: 'seedRanges',
					code: result.code,
					action: existing ? 'updated' : 'created',
				})
			}

			Logger.debug('PrismaPrescriptionRangesRepository: seedRanges completed', {
				operation: 'seedRanges',
				table: 'prescriptionRange',
				result: { created, updated, total: ranges.length },
			})

			return { created, updated }
		} catch (error) {
			Logger.error('PrismaPrescriptionRangesRepository: seedRanges failed', {
				operation: 'seedRanges',
				table: 'prescriptionRange',
				error: error instanceof Error ? error.message : String(error),
			})
			throw error
		}
	}
}
