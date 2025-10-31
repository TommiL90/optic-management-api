import type { PrescriptionRangeData } from '@/modules/lenses/schemas/lenses.schemas.ts'

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
}
