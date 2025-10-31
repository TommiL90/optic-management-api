import { randomUUID } from 'node:crypto'
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

export class InMemoryLensesRepository implements ILensesRepository {
	public prescriptionRanges: PrescriptionRangeData[] = []
	public lensProducts: LensProductData[] = []

	async findPrescriptionRange(
		odSphere: number,
		odCylinder: number,
		oiSphere: number,
		oiCylinder: number,
	): Promise<PrescriptionRangeData | null> {
		const matchingRanges = this.prescriptionRanges
			.filter(
				(range) =>
					range.odMaxSphere >= odSphere &&
					range.odMaxCylinder >= odCylinder &&
					range.oiMaxSphere >= oiSphere &&
					range.oiMaxCylinder >= oiCylinder,
			)
			.sort((a, b) => {
				if (a.odMaxSphere !== b.odMaxSphere) return a.odMaxSphere - b.odMaxSphere
				if (a.odMaxCylinder !== b.odMaxCylinder) return a.odMaxCylinder - b.odMaxCylinder
				if (a.oiMaxSphere !== b.oiMaxSphere) return a.oiMaxSphere - b.oiMaxSphere
				return a.oiMaxCylinder - b.oiMaxCylinder
			})

		return matchingRanges.length > 0 ? matchingRanges[0] : null
	}

	async findProductsByRange(
		prescriptionRangeId: string,
		filters: Filters,
	): Promise<LensProductData[]> {
		return this.lensProducts
			.filter((product) => {
				if (product.prescriptionRangeId !== prescriptionRangeId) return false
				if (!product.available) return false
				if (product.frameType !== filters.frameType) return false
				if (filters.material !== undefined && product.material !== filters.material) return false
				if (filters.hasBlueFilter !== undefined && product.hasBlueFilter !== filters.hasBlueFilter)
					return false
				if (
					filters.isPhotochromic !== undefined &&
					product.isPhotochromic !== filters.isPhotochromic
				)
					return false
				if (
					filters.hasAntiReflective !== undefined &&
					product.hasAntiReflective !== filters.hasAntiReflective
				)
					return false
				if (filters.isPolarized !== undefined && product.isPolarized !== filters.isPolarized)
					return false
				if (filters.tipo !== undefined && product.tipo !== filters.tipo) return false
				return true
			})
			.sort((a, b) => a.finalPrice - b.finalPrice)
	}

	addPrescriptionRange(
		data: Omit<PrescriptionRangeData, 'id' | 'createdAt' | 'updatedAt'>,
	): PrescriptionRangeData {
		const range: PrescriptionRangeData = {
			id: randomUUID(),
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.prescriptionRanges.push(range)
		return range
	}

	addLensProduct(
		data: Omit<LensProductData, 'id' | 'createdAt' | 'updatedAt'>,
	): LensProductData {
		const product: LensProductData = {
			id: randomUUID(),
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.lensProducts.push(product)
		return product
	}

	/**
	 * Create a new lens product
	 * @param data - Lens product data
	 * @returns Promise with created lens product
	 */
	async create(data: CreateLensProduct): Promise<LensProductResponse> {
		Logger.debug('InMemoryLensesRepository: create started', {
			operation: 'create',
			table: 'lensProduct',
			input: { sku: data.sku, name: data.name }
		})

		try {
			const product: LensProductData = {
				id: randomUUID(),
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
				costPrice: data.costPrice ?? null,
				basePrice: data.basePrice,
				finalPrice: data.finalPrice,
				deliveryDays: data.deliveryDays,
				observations: data.observations ?? null,
				available: data.available,
				prescriptionRangeId: data.prescriptionRangeId,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			this.lensProducts.push(product)
			const response = this.mapLensProductToResponse(product)

			Logger.debug('InMemoryLensesRepository: create completed', {
				operation: 'create',
				table: 'lensProduct',
				result: { productId: product.id, sku: product.sku }
			})

			return response
		} catch (error) {
			Logger.error('InMemoryLensesRepository: create failed', {
				operation: 'create',
				table: 'lensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	async findBySku(sku: string): Promise<LensProductResponse | null> {
		Logger.debug('InMemoryLensesRepository: findBySku started', { sku, lensProducts: this.lensProducts.map(p => ({ id: p.id, sku: p.sku })) })
		const product = this.lensProducts.find(p => p.sku === sku)

		if (!product) {
			Logger.debug('InMemoryLensesRepository: findBySku completed - not found', { sku })
			return null
		}

		Logger.debug('InMemoryLensesRepository: findBySku completed - found', { sku, productId: product.id })
		return this.mapLensProductToResponse(product)
	}

	/**
	 * Find lens product by ID
	 * @param id - Lens product ID
	 * @returns Promise with lens product or null
	 */
	async findById(id: string): Promise<LensProductResponse | null> {
		Logger.debug('InMemoryLensesRepository: findById started', {
			operation: 'findById',
			table: 'lensProduct',
			filters: { id }
		})

		try {
			const product = this.lensProducts.find(p => p.id === id)

			if (!product) {
				Logger.debug('InMemoryLensesRepository: findById completed - not found', {
					operation: 'findById',
					table: 'lensProduct',
					result: { found: false }
				})
				return null
			}

			const response = this.mapLensProductToResponse(product)

			Logger.debug('InMemoryLensesRepository: findById completed', {
				operation: 'findById',
				table: 'lensProduct',
				result: { productId: product.id, sku: product.sku }
			})

			return response
		} catch (error) {
			Logger.error('InMemoryLensesRepository: findById failed', {
				operation: 'findById',
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
		Logger.debug('InMemoryLensesRepository: findAll started', {
			operation: 'findAll',
			table: 'lensProduct'
		})

		try {
			const products = this.lensProducts
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

			const response = products.map(product => this.mapLensProductToResponse(product))

			Logger.debug('InMemoryLensesRepository: findAll completed', {
				operation: 'findAll',
				table: 'lensProduct',
				result: { count: products.length }
			})

			return response
		} catch (error) {
			Logger.error('InMemoryLensesRepository: findAll failed', {
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
		Logger.debug('InMemoryLensesRepository: update started', {
			operation: 'update',
			table: 'lensProduct',
			filters: { id },
			input: { sku: data.sku, name: data.name }
		})

		try {
			const productIndex = this.lensProducts.findIndex(p => p.id === id)
			
			if (productIndex === -1) {
				throw new Error(`Product with id ${id} not found`)
			}

			const existingProduct = this.lensProducts[productIndex]
			const updatedProduct: LensProductData = {
				...existingProduct,
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
				updatedAt: new Date(),
			}

			this.lensProducts[productIndex] = updatedProduct
			const response = this.mapLensProductToResponse(updatedProduct)

			Logger.debug('InMemoryLensesRepository: update completed', {
				operation: 'update',
				table: 'lensProduct',
				result: { productId: updatedProduct.id, sku: updatedProduct.sku }
			})

			return response
		} catch (error) {
			Logger.error('InMemoryLensesRepository: update failed', {
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
		Logger.debug('InMemoryLensesRepository: delete started', {
			operation: 'delete',
			table: 'lensProduct',
			filters: { id }
		})

		try {
			const productIndex = this.lensProducts.findIndex(p => p.id === id)
			
			if (productIndex === -1) {
				throw new Error(`Product with id ${id} not found`)
			}

			this.lensProducts.splice(productIndex, 1)

			Logger.debug('InMemoryLensesRepository: delete completed', {
				operation: 'delete',
				table: 'lensProduct',
				result: { productId: id }
			})
		} catch (error) {
			Logger.error('InMemoryLensesRepository: delete failed', {
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
	private mapLensProductToResponse(product: LensProductData): LensProductResponse {
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
