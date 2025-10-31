import { prisma } from '@/core/database/prisma.client.ts'
import { Logger } from '@/core/utils/logger.util.ts'
import type { ILensesRepository } from '@/modules/lenses/repositories/lenses.repository.interface.ts'
import type {
	Filters,
	LensProductData,
	PrescriptionRangeData,
	CreateLensProduct,
	UpdateLensProduct,
	LensProductResponse,
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
	async create(data: CreateLensProduct): Promise<LensProductResponse> {
		Logger.debug('PrismaLensesRepository: create started', {
			operation: 'create',
			table: 'lensProduct',
			input: { sku: data.sku, name: data.name }
		})

		try {
			const product = await prisma.lensProduct.create({
				data: {
					sku: data.sku,
					name: data.name,
					material: data.material,
					tipo: data.tipo,
					frameType: data.frameType,
					hasAntiReflective: data.hasAntiReflective,
					hasBlueFilter: data.hasBlueFilter,
					isPhotochromic: data.isPhotochromic,
					hasUVProtection: data.hasUVProtection,
					isPolarized: data.isPolarized,
					isMirrored: data.isMirrored,
					costPrice: data.costPrice,
					basePrice: data.basePrice,
					finalPrice: data.finalPrice,
					deliveryDays: data.deliveryDays,
					observations: data.observations,
					available: data.available,
					prescriptionRangeId: data.prescriptionRangeId,
				},
			})

			const response = this.mapLensProductToResponse(product)

			Logger.debug('PrismaLensesRepository: create completed', {
				operation: 'create',
				table: 'lensProduct',
				result: { productId: product.id, sku: product.sku }
			})

			return response
		} catch (error) {
			Logger.error('PrismaLensesRepository: create failed', {
				operation: 'create',
				table: 'lensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}


	/**
	 * Find lens product by ID
	 * @param id - Lens product ID
	 * @returns Promise with lens product or null
	 */
	async findById(id: string): Promise<LensProductResponse | null> {
		Logger.debug('PrismaLensesRepository: findById started', {
			operation: 'findById',
			table: 'lensProduct',
			filters: { id }
		})

		try {
			const product = await prisma.lensProduct.findUnique({
				where: { id },
			})

			if (!product) {
				Logger.debug('PrismaLensesRepository: findById completed - not found', {
					operation: 'findById',
					table: 'lensProduct',
					result: { found: false }
				})
				return null
			}

			const response = this.mapLensProductToResponse(product)

			Logger.debug('PrismaLensesRepository: findById completed', {
				operation: 'findById',
				table: 'lensProduct',
				result: { productId: product.id, sku: product.sku }
			})

			return response
		} catch (error) {
			Logger.error('PrismaLensesRepository: findById failed', {
				operation: 'findById',
				table: 'lensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	async findBySku(sku: string): Promise<LensProductResponse | null> {
		Logger.debug('PrismaLensesRepository: findBySku started', {
			operation: 'findBySku',
			table: 'lensProduct',
			filters: { sku }
		})

		try {
			const product = await prisma.lensProduct.findUnique({
				where: { sku },
			})

			if (!product) {
				Logger.debug('PrismaLensesRepository: findBySku completed - not found', {
					operation: 'findBySku',
					table: 'lensProduct',
					result: { found: false }
				})
				return null
			}

			const response = this.mapLensProductToResponse(product)

			Logger.debug('PrismaLensesRepository: findBySku completed', {
				operation: 'findBySku',
				table: 'lensProduct',
				result: { productId: product.id, sku: product.sku }
			})

			return response
		} catch (error) {
			Logger.error('PrismaLensesRepository: findBySku failed', {
				operation: 'findBySku',
				table: 'lensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Get all lens products (no pagination)
	 * @returns Promise with array of lens products
	 */
	async findAll(): Promise<LensProductResponse[]> {
		Logger.debug('PrismaLensesRepository: findAll started', {
			operation: 'findAll',
			table: 'lensProduct'
		})

		try {
			const products = await prisma.lensProduct.findMany({
				orderBy: {
					createdAt: 'desc',
				},
			})

			const response = products.map(product => this.mapLensProductToResponse(product))

			Logger.debug('PrismaLensesRepository: findAll completed', {
				operation: 'findAll',
				table: 'lensProduct',
				result: { count: products.length }
			})

			return response
		} catch (error) {
			Logger.error('PrismaLensesRepository: findAll failed', {
				operation: 'findAll',
				table: 'lensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Update lens product
	 * @param id - Lens product ID
	 * @param data - Lens product data to update
	 * @returns Promise with updated lens product
	 */
	async update(id: string, data: UpdateLensProduct): Promise<LensProductResponse> {
		Logger.debug('PrismaLensesRepository: update started', {
			operation: 'update',
			table: 'lensProduct',
			filters: { id },
			input: { sku: data.sku, name: data.name }
		})

		try {
			const product = await prisma.lensProduct.update({
				where: { id },
				data: {
					...(data.sku !== undefined && { sku: data.sku }),
					...(data.name !== undefined && { name: data.name }),
					...(data.material !== undefined && { material: data.material }),
					...(data.tipo !== undefined && { tipo: data.tipo }),
					...(data.frameType !== undefined && { frameType: data.frameType }),
					...(data.hasAntiReflective !== undefined && { hasAntiReflective: data.hasAntiReflective }),
					...(data.hasBlueFilter !== undefined && { hasBlueFilter: data.hasBlueFilter }),
					...(data.isPhotochromic !== undefined && { isPhotochromic: data.isPhotochromic }),
					...(data.hasUVProtection !== undefined && { hasUVProtection: data.hasUVProtection }),
					...(data.isPolarized !== undefined && { isPolarized: data.isPolarized }),
					...(data.isMirrored !== undefined && { isMirrored: data.isMirrored }),
					...(data.costPrice !== undefined && { costPrice: data.costPrice }),
					...(data.basePrice !== undefined && { basePrice: data.basePrice }),
					...(data.finalPrice !== undefined && { finalPrice: data.finalPrice }),
					...(data.deliveryDays !== undefined && { deliveryDays: data.deliveryDays }),
					...(data.observations !== undefined && { observations: data.observations }),
					...(data.available !== undefined && { available: data.available }),
					...(data.prescriptionRangeId !== undefined && { prescriptionRangeId: data.prescriptionRangeId }),
				},
			})

			const response = this.mapLensProductToResponse(product)

			Logger.debug('PrismaLensesRepository: update completed', {
				operation: 'update',
				table: 'lensProduct',
				result: { productId: product.id, sku: product.sku }
			})

			return response
		} catch (error) {
			Logger.error('PrismaLensesRepository: update failed', {
				operation: 'update',
				table: 'lensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Delete lens product
	 * @param id - Lens product ID
	 * @returns Promise void
	 */
	async delete(id: string): Promise<void> {
		Logger.debug('PrismaLensesRepository: delete started', {
			operation: 'delete',
			table: 'lensProduct',
			filters: { id }
		})

		try {
			await prisma.lensProduct.delete({
				where: { id },
			})

			Logger.debug('PrismaLensesRepository: delete completed', {
				operation: 'delete',
				table: 'lensProduct',
				result: { productId: id }
			})
		} catch (error) {
			Logger.error('PrismaLensesRepository: delete failed', {
				operation: 'delete',
				table: 'lensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Maps lens product data to response format
	 * @param product - Lens product data from database
	 * @returns Lens product response DTO
	 */
	private mapLensProductToResponse(product: any): LensProductResponse {
		return {
			id: product.id,
			sku: product.sku,
			name: product.name,
			material: product.material,
			tipo: product.tipo,
			frameType: product.frameType,
			features: {
				hasAntiReflective: product.hasAntiReflective,
				hasBlueFilter: product.hasBlueFilter,
				isPhotochromic: product.isPhotochromic,
				hasUVProtection: product.hasUVProtection,
				isPolarized: product.isPolarized,
				isMirrored: product.isMirrored,
			},
			pricing: {
				basePrice: product.basePrice,
				finalPrice: product.finalPrice,
			},
			deliveryDays: product.deliveryDays,
			observations: product.observations,
			available: product.available,
			prescriptionRangeId: product.prescriptionRangeId,
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString(),
		}
	}
}
