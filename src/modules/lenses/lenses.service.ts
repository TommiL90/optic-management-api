import { PrescriptionRangeNotFoundException, NotFoundException, ConflictException } from '@/core/errors/app-errors.ts'
import { Logger } from '@/core/utils/logger.util.ts'
import type { ILensesRepository } from '@/modules/lenses/repositories/lenses.repository.interface.ts'
import {
	lensProductResponseSchema,
	type LensProductData,
	type LensProductResponse,
	type Prescription,
	type QuoteLensesRequest,
	type QuoteLensesResponse,
	type CreateLensProduct,
	type UpdateLensProduct,
	type LensProductsResponse,
} from '@/modules/lenses/schemas/lenses.schemas.ts'

/**
 * Lenses Service
 * Contains business logic for lens quotation
 */
export class LensesService {
	constructor(private readonly lensesRepository: ILensesRepository) {}

	/**
	 * Normalizes a value to the nearest 0.25 increment
	 * @param value - Value to normalize
	 * @returns Normalized value
	 */
	private normalizeValue(value: number): number {
		return Math.round(value * 4) / 4
	}

	/**
	 * Normalizes prescription values to 0.25 increments
	 * @param prescription - Original prescription
	 * @returns Normalized prescription
	 */
	private normalizePrescription(prescription: Prescription): Prescription {
		return {
			od: {
				sphere: this.normalizeValue(prescription.od.sphere),
				cylinder: this.normalizeValue(prescription.od.cylinder),
			},
			oi: {
				sphere: this.normalizeValue(prescription.oi.sphere),
				cylinder: this.normalizeValue(prescription.oi.cylinder),
			},
		}
	}

	/**
	 * Sorts eyes by complexity (lower first, higher second) for symmetric range matching
	 * Complexity is calculated as: abs(sphere) + abs(cylinder)
	 * @param prescription - Normalized prescription
	 * @returns Sorted eyes: [minEye, maxEye]
	 */
	private sortEyesByComplexity(prescription: Prescription): {
		minEye: { sphere: number; cylinder: number }
		maxEye: { sphere: number; cylinder: number }
	} {
		const odComplexity = Math.abs(prescription.od.sphere) + Math.abs(prescription.od.cylinder)
		const oiComplexity = Math.abs(prescription.oi.sphere) + Math.abs(prescription.oi.cylinder)

		if (odComplexity <= oiComplexity) {
			return {
				minEye: { sphere: Math.abs(prescription.od.sphere), cylinder: Math.abs(prescription.od.cylinder) },
				maxEye: { sphere: Math.abs(prescription.oi.sphere), cylinder: Math.abs(prescription.oi.cylinder) },
			}
		}

		return {
			minEye: { sphere: Math.abs(prescription.oi.sphere), cylinder: Math.abs(prescription.oi.cylinder) },
			maxEye: { sphere: Math.abs(prescription.od.sphere), cylinder: Math.abs(prescription.od.cylinder) },
		}
	}

	/**
	 * Maps lens product data to response format using Zod schema
	 * @param product - Lens product data from repository
	 * @returns Lens product response DTO
	 */
	private mapLensProductToResponse(product: LensProductData): LensProductResponse {
		const mapped = {
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
			createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
			updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
		}

		// Validate with Zod schema to ensure type safety
		return lensProductResponseSchema.parse(mapped)
	}

	/**
	 * Quotes lenses based on prescription and filters
	 * @param request - Quote request with prescription and filters
	 * @returns Quote response with available products
	 * @throws PrescriptionRangeNotFoundException if no price range covers the prescription
	 */
	async quoteLenses(request: QuoteLensesRequest): Promise<QuoteLensesResponse> {
		const originalPrescription = { ...request.prescription }
		const normalized = this.normalizePrescription(request.prescription)

		// Sort eyes by complexity for symmetric range matching
		const { minEye, maxEye } = this.sortEyesByComplexity(normalized)

		const range = await this.lensesRepository.findPrescriptionRange(
			minEye.sphere,
			minEye.cylinder,
			maxEye.sphere,
			maxEye.cylinder,
		)

		if (!range) {
			throw new PrescriptionRangeNotFoundException(normalized)
		}

		const products = await this.lensesRepository.findProductsByRange(range.id, request.filters)
		const results = products.map((product) => this.mapLensProductToResponse(product))

		return {
			results,
			meta: {
				originalPrescription,
				normalizedPrescription: normalized,
				prescriptionRangeUsed: {
					code: range.code,
					description: range.description,
				},
				totalResults: results.length,
				filtersApplied: request.filters,
			},
		}
	}

	/**
	 * Create a new lens product with business logic
	 * @param payload - Lens product data
	 * @returns Promise with created lens product
	 */
	async createLensProduct(payload: CreateLensProduct): Promise<LensProductResponse> {
		Logger.businessLogic('LensesService: createLensProduct started', {
			operation: 'createLensProduct',
			input: { sku: payload.sku, name: payload.name }
		})

		try {
			// Business logic: Check if SKU already exists
			const existingProduct = await this.lensesRepository.findBySku(payload.sku)
			Logger.debug('LensesService: createLensProduct - existingProduct check', { sku: payload.sku, existingProduct: existingProduct?.id })
			if (existingProduct) {
				throw new ConflictException('SKU already exists', {
					sku: payload.sku,
					field: 'sku',
				})
			}

			const rawProduct = await this.lensesRepository.create(payload)
			const product = this.mapLensProductToResponse(rawProduct)

			Logger.businessLogic('LensesService: createLensProduct completed', {
				operation: 'createLensProduct',
				result: { productId: product.id, sku: product.sku }
			})

			return product
		} catch (error) {
			Logger.error('LensesService: createLensProduct failed', {
				operation: 'createLensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Find lens product by ID with business logic
	 * @param id - Lens product ID
	 * @returns Promise with lens product
	 */
	async findLensProductById(id: string): Promise<LensProductResponse> {
		Logger.businessLogic('LensesService: findLensProductById started', {
			operation: 'findLensProductById',
			input: { id }
		})

		try {
			const rawProduct = await this.lensesRepository.findById(id)
			if (!rawProduct) {
				throw new NotFoundException('Lens Product', id)
			}

			const product = this.mapLensProductToResponse(rawProduct)

			Logger.businessLogic('LensesService: findLensProductById completed', {
				operation: 'findLensProductById',
				result: { productId: product.id, sku: product.sku }
			})

			return product
		} catch (error) {
			Logger.error('LensesService: findLensProductById failed', {
				operation: 'findLensProductById',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Get all lens products (no pagination)
	 * @returns Promise with array of lens products
	 */
	async findAllLensProducts(): Promise<LensProductsResponse> {
		Logger.businessLogic('LensesService: findAllLensProducts started', {
			operation: 'findAllLensProducts'
		})

		try {
			const rawProducts = await this.lensesRepository.findAll(true) // Include prescriptionRange
			const products = rawProducts.map(p => this.mapLensProductToResponse(p))

			const result: LensProductsResponse = {
				products,
			}

			Logger.businessLogic('LensesService: findAllLensProducts completed', {
				operation: 'findAllLensProducts',
				result: { count: products.length }
			})

			return result
		} catch (error) {
			Logger.error('LensesService: findAllLensProducts failed', {
				operation: 'findAllLensProducts',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Update lens product with business logic
	 * @param id - Lens product ID
	 * @param updateData - Lens product data to update
	 * @returns Promise with updated lens product
	 */
	async updateLensProduct(id: string, updateData: UpdateLensProduct): Promise<LensProductResponse> {
		Logger.businessLogic('LensesService: updateLensProduct started', {
			operation: 'updateLensProduct',
			input: { id, data: updateData }
		})

		try {
			// Business logic: Check if product exists
			const productToUpdate = await this.findLensProductById(id)

			// Business logic: If updating SKU, check if it's already taken
			if (updateData.sku) {
				const existingProduct = await this.lensesRepository.findBySku(updateData.sku)
				Logger.debug('LensesService: updateLensProduct - existingProduct check', { sku: updateData.sku, existingProduct: existingProduct?.id })
				if (existingProduct && existingProduct.id !== productToUpdate.id) {
					throw new ConflictException('SKU already taken', {
						sku: updateData.sku,
						field: 'sku',
					})
				}
			}

			const rawUpdatedProduct = await this.lensesRepository.update(id, updateData)
			const updatedProduct = this.mapLensProductToResponse(rawUpdatedProduct)

			Logger.businessLogic('LensesService: updateLensProduct completed', {
				operation: 'updateLensProduct',
				result: { productId: updatedProduct.id, sku: updatedProduct.sku }
			})

			return updatedProduct
		} catch (error) {
			Logger.error('LensesService: updateLensProduct failed', {
				operation: 'updateLensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	/**
	 * Delete lens product with business logic
	 * @param id - Lens product ID
	 * @returns Promise void
	 */
	async deleteLensProduct(id: string): Promise<void> {
		Logger.businessLogic('LensesService: deleteLensProduct started', {
			operation: 'deleteLensProduct',
			input: { id }
		})

		try {
			// Business logic: Check if product exists
			await this.findLensProductById(id)

			// Business logic: Check if product can be deleted (e.g., has no orders, etc.)
			// const canDelete = await this.checkIfProductCanBeDeleted(id);
			// if (!canDelete) {
			//   throw new Error('Product cannot be deleted');
			// }

			await this.lensesRepository.delete(id)

			Logger.businessLogic('LensesService: deleteLensProduct completed', {
				operation: 'deleteLensProduct',
				result: { productId: id }
			})
		} catch (error) {
			Logger.error('LensesService: deleteLensProduct failed', {
				operation: 'deleteLensProduct',
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}
}
