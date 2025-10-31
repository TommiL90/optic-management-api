import { randomUUID } from 'node:crypto'
import type { ILensesRepository, LensProductWithRange } from '@/modules/lenses/repositories/lenses.repository.interface.ts'
import type {
	Filters,
	LensProductData,
	PrescriptionRangeData,
	CreateLensProduct,
	UpdateLensProduct,
} from '@/modules/lenses/schemas/lenses.schemas.ts'

export class InMemoryLensesRepository implements ILensesRepository {
	public prescriptionRanges: PrescriptionRangeData[] = []
	public lensProducts: LensProductData[] = []

	async findPrescriptionRange(
		minEyeSphere: number,
		minEyeCylinder: number,
		maxEyeSphere: number,
		maxEyeCylinder: number,
	): Promise<PrescriptionRangeData | null> {
		const matchingRanges = this.prescriptionRanges
			.filter(
				(range) =>
					range.minEyeMaxSphere >= minEyeSphere &&
					range.minEyeMaxCylinder >= minEyeCylinder &&
					range.maxEyeMaxSphere >= maxEyeSphere &&
					range.maxEyeMaxCylinder >= maxEyeCylinder,
			)
			.sort((a, b) => {
				if (a.minEyeMaxSphere !== b.minEyeMaxSphere) return a.minEyeMaxSphere - b.minEyeMaxSphere
				if (a.minEyeMaxCylinder !== b.minEyeMaxCylinder) return a.minEyeMaxCylinder - b.minEyeMaxCylinder
				if (a.maxEyeMaxSphere !== b.maxEyeMaxSphere) return a.maxEyeMaxSphere - b.maxEyeMaxSphere
				return a.maxEyeMaxCylinder - b.maxEyeMaxCylinder
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
	async create(data: CreateLensProduct): Promise<LensProductData> {
		const product: LensProductData = {
			id: randomUUID(),
			...data,
			costPrice: data.costPrice ?? null,
			observations: data.observations ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		this.lensProducts.push(product)
		return product
	}

	async findBySku(sku: string): Promise<LensProductData | null> {
		return this.lensProducts.find(p => p.sku === sku) ?? null
	}

	/**
	 * Find lens product by ID
	 * @param id - Lens product ID
	 * @returns Promise with lens product or null
	 */
	async findById(id: string): Promise<LensProductData | null> {
		return this.lensProducts.find(p => p.id === id) ?? null
	}

	/**
	 * Get all lens products (no pagination)
	 * @param includeRelations - Whether to include prescriptionRange relation
	 * @returns Promise with array of lens products
	 */
	async findAll(includeRelations: true): Promise<LensProductWithRange[]>
	async findAll(includeRelations?: false): Promise<LensProductData[]>
	async findAll(includeRelations = false): Promise<LensProductData[] | LensProductWithRange[]> {
		const sortedProducts = [...this.lensProducts].sort((a, b) => {
			const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
			const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
			return bTime - aTime
		})

		if (includeRelations) {
			return sortedProducts.map(product => {
				const prescriptionRange = this.prescriptionRanges.find(r => r.id === product.prescriptionRangeId)
				return {
					...product,
					prescriptionRange: prescriptionRange ?? null,
				} as LensProductWithRange
			})
		}

		return sortedProducts
	}

	/**
	 * Update lens product
	 * @param id - Lens product ID
	 * @param data - Lens product data to update
	 * @returns Promise with updated lens product
	 */
	async update(id: string, data: UpdateLensProduct): Promise<LensProductData> {
		const productIndex = this.lensProducts.findIndex(p => p.id === id)

		if (productIndex === -1) {
			throw new Error(`Product with id ${id} not found`)
		}

		const existingProduct = this.lensProducts[productIndex]
		const updatedProduct: LensProductData = {
			...existingProduct,
			...data,
			updatedAt: new Date(),
		}

		this.lensProducts[productIndex] = updatedProduct
		return updatedProduct
	}

	/**
	 * Delete lens product
	 * @param id - Lens product ID
	 * @returns Promise void
	 */
	async delete(id: string): Promise<void> {
		const productIndex = this.lensProducts.findIndex(p => p.id === id)

		if (productIndex === -1) {
			throw new Error(`Product with id ${id} not found`)
		}

		this.lensProducts.splice(productIndex, 1)
	}
}
