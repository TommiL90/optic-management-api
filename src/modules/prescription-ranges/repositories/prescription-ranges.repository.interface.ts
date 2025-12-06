import type { PrescriptionRangeData } from '@/modules/lenses/schemas/lenses.schemas.ts'
import type { PrescriptionRangeInput } from '@/modules/prescription-ranges/schemas/prescription-ranges.schemas.ts'

/**
 * Prescription Ranges Repository Interface
 * Defines the contract for prescription ranges data access operations
 */
export interface IPrescriptionRangesRepository {
	/**
	 * Get all prescription ranges
	 * @returns Promise with array of prescription ranges
	 */
	findAll(): Promise<PrescriptionRangeData[]>

	/**
	 * Seed prescription ranges (upsert by code)
	 * @param ranges - Array of prescription range data to seed
	 * @returns Promise with count of created and updated ranges
	 */
	seedRanges(ranges: PrescriptionRangeInput[]): Promise<{ created: number; updated: number }>
}
