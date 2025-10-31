import type {
	Filters,
	LensProductData,
	PrescriptionRangeData,
	CreateLensProduct,
	UpdateLensProduct,
	LensProductResponse,
} from '@/modules/lenses/schemas/lenses.schemas.ts'

/**
 * Lenses Repository Interface
 * Defines the contract for lenses data access operations
 *
 * This interface allows for multiple implementations:
 * - PrismaLensesRepository (SQLite, PostgreSQL, MySQL)
 * - InMemoryLensesRepository (Testing)
 */
export interface ILensesRepository {
	/**
	 * Find prescription range that covers given values (order-independent)
	 * @param minEyeSphere - Eye with lower complexity sphere (absolute value)
	 * @param minEyeCylinder - Eye with lower complexity cylinder (absolute value)
	 * @param maxEyeSphere - Eye with higher complexity sphere (absolute value)
	 * @param maxEyeCylinder - Eye with higher complexity cylinder (absolute value)
	 * @returns Promise with prescription range or null
	 */
	findPrescriptionRange(
		minEyeSphere: number,
		minEyeCylinder: number,
		maxEyeSphere: number,
		maxEyeCylinder: number,
	): Promise<PrescriptionRangeData | null>

	/**
	 * Find available lens products for a prescription range with optional filters
	 * @param prescriptionRangeId - Prescription range ID
	 * @param filters - Optional filters (material, coatings, etc.)
	 * @returns Promise with array of lens products
	 */
	findProductsByRange(prescriptionRangeId: string, filters: Filters): Promise<LensProductData[]>

	/**
	 * Create a new lens product
	 * @param data - Lens product data
	 * @returns Promise with created lens product
	 */
	create(data: CreateLensProduct): Promise<LensProductResponse>

	/**
	 * Find lens product by ID
	 * @param id - Lens product ID
	 * @returns Promise with lens product or null
	 */
	findById(id: string): Promise<LensProductResponse | null>

	/**
	 * Find lens product by SKU
	 * @param sku - Lens product SKU
	 * @returns Promise with lens product or null
	 */
	findBySku(sku: string): Promise<LensProductResponse | null>

	/**
	 * Get all lens products (no pagination)
	 * @returns Promise with array of lens products
	 */
	findAll(): Promise<LensProductResponse[]>

	/**
	 * Update lens product
	 * @param id - Lens product ID
	 * @param data - Lens product data to update
	 * @returns Promise with updated lens product
	 */
	update(id: string, data: UpdateLensProduct): Promise<LensProductResponse>

	/**
	 * Delete lens product
	 * @param id - Lens product ID
	 * @returns Promise void
	 */
	delete(id: string): Promise<void>
}
