import { prisma } from '@/core/database/prisma.client.ts'
import type { ILensesRepository, LensProductWithRange } from '@/modules/lenses/repositories/lenses.repository.interface.ts'
import type {
	Filters,
	LensProductData,
	PrescriptionRangeData,
	CreateLensProduct,
	UpdateLensProduct,
} from '@/modules/lenses/schemas/lenses.schemas.ts'

export class PrismaLensesRepository implements ILensesRepository {
	async findPrescriptionRange(
		minEyeSphere: number,
		minEyeCylinder: number,
		maxEyeSphere: number,
		maxEyeCylinder: number,
	): Promise<PrescriptionRangeData | null> {
		const range = await prisma.prescriptionRange.findFirst({
			where: {
				minEyeMaxSphere: { gte: minEyeSphere },
				minEyeMaxCylinder: { gte: minEyeCylinder },
				maxEyeMaxSphere: { gte: maxEyeSphere },
				maxEyeMaxCylinder: { gte: maxEyeCylinder },
			},
			orderBy: [
				{ minEyeMaxSphere: 'asc' },
				{ minEyeMaxCylinder: 'asc' },
				{ maxEyeMaxSphere: 'asc' },
				{ maxEyeMaxCylinder: 'asc' },
			],
		})

		return range
	}

	async findProductsByRange(
		prescriptionRangeId: string,
		filters: Filters,
	): Promise<LensProductData[]> {
		const products = await prisma.lensProduct.findMany({
			where: {
				prescriptionRangeId,
				available: true,
				frameType: filters.frameType,
				...(filters.material !== undefined && { material: filters.material }),
				...(filters.hasBlueFilter !== undefined && { hasBlueFilter: filters.hasBlueFilter }),
				...(filters.isPhotochromic !== undefined && { isPhotochromic: filters.isPhotochromic }),
				...(filters.hasAntiReflective !== undefined && {
					hasAntiReflective: filters.hasAntiReflective,
				}),
				...(filters.isPolarized !== undefined && { isPolarized: filters.isPolarized }),
				...(filters.tipo !== undefined && { tipo: filters.tipo }),
			},
			orderBy: {
				finalPrice: 'asc',
			},
		})

		return products
	}

	/**
	 * Create a new lens product
	 * @param data - Lens product data
	 * @returns Promise with created lens product
	 */
	async create(data: CreateLensProduct): Promise<LensProductData> {
		return await prisma.lensProduct.create({ data })
	}


	/**
	 * Find lens product by ID
	 * @param id - Lens product ID
	 * @returns Promise with lens product or null
	 */
	async findById(id: string): Promise<LensProductData | null> {
		return await prisma.lensProduct.findUnique({ where: { id } })
	}

	async findBySku(sku: string): Promise<LensProductData | null> {
		return await prisma.lensProduct.findUnique({ where: { sku } })
	}

	/**
	 * Get all lens products (no pagination)
	 * @param includeRelations - Whether to include prescriptionRange relation
	 * @returns Promise with array of lens products
	 */
	async findAll(includeRelations: true): Promise<LensProductWithRange[]>
	async findAll(includeRelations?: false): Promise<LensProductData[]>
	async findAll(includeRelations = false): Promise<LensProductData[] | LensProductWithRange[]> {
		return await prisma.lensProduct.findMany({
			orderBy: { createdAt: 'desc' },
			...(includeRelations && { include: { prescriptionRange: true } }),
		})
	}

	/**
	 * Update lens product
	 * @param id - Lens product ID
	 * @param data - Lens product data to update
	 * @returns Promise with updated lens product
	 */
	async update(id: string, data: UpdateLensProduct): Promise<LensProductData> {
		return await prisma.lensProduct.update({
			where: { id },
			data,
		})
	}

	/**
	 * Delete lens product
	 * @param id - Lens product ID
	 * @returns Promise void
	 */
	async delete(id: string): Promise<void> {
		await prisma.lensProduct.delete({ where: { id } })
	}
}
