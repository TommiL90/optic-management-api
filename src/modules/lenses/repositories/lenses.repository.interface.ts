import type { Prisma } from '@prisma/client'
import type {
	Filters,
	LensProductData,
	PrescriptionRangeData,
	CreateLensProduct,
	UpdateLensProduct,
} from '@/modules/lenses/schemas/lenses.schemas.ts'

// Prisma types for lens products with/without relations
export type LensProductWithRange = Prisma.LensProductGetPayload<{
	include: { prescriptionRange: true }
}>

/**
 * Lenses Repository Interface
 * Defines the contract for lenses data access operations
 *
 * This interface allows for multiple implementations:
 * - PrismaLensesRepository (SQLite, PostgreSQL, MySQL)
 * - InMemoryLensesRepository (Testing)
 *
 * NOTE: Repository methods return RAW data types (Prisma objects or plain data).
 * The Service layer is responsible for transforming to DTOs/Response types.
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
	 * @returns Promise with array of lens products (raw data)
	 */
	findProductsByRange(prescriptionRangeId: string, filters: Filters): Promise<LensProductData[]>

	/**
	 * Create a new lens product
	 * @param data - Lens product data
	 * @returns Promise with created lens product (raw data)
	 */
	create(data: CreateLensProduct): Promise<LensProductData>

	/**
	 * Find lens product by ID
	 * @param id - Lens product ID
	 * @returns Promise with lens product or null (raw data)
	 */
	findById(id: string): Promise<LensProductData | null>

	/**
	 * Find lens product by SKU
	 * @param sku - Lens product SKU
	 * @returns Promise with lens product or null (raw data)
	 */
	findBySku(sku: string): Promise<LensProductData | null>

	/**
	 * Get all lens products with optional prescriptionRange relation
	 * @param includeRelations - Whether to include prescriptionRange relation
	 * @returns Promise with array of lens products (raw data, possibly with relations)
	 */
	findAll(includeRelations: true): Promise<LensProductWithRange[]>
	findAll(includeRelations?: false): Promise<LensProductData[]>
	findAll(includeRelations?: boolean): Promise<LensProductData[] | LensProductWithRange[]>

	/**
	 * Update lens product
	 * @param id - Lens product ID
	 * @param data - Lens product data to update
	 * @returns Promise with updated lens product (raw data)
	 */
	update(id: string, data: UpdateLensProduct): Promise<LensProductData>

	/**
	 * Delete lens product
	 * @param id - Lens product ID
	 * @returns Promise void
	 */
	delete(id: string): Promise<void>
}
