import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PrescriptionRangeNotFoundException } from '@/core/errors/app-errors'
import { InMemoryLensesRepository } from '../repositories/in-memory-lenses.repository'
import { LensesService } from '../lenses.service'
import type { QuoteLensesRequest } from '../schemas/lenses.schemas'

// Mock the Logger to be framework-agnostic
vi.mock('@/core/utils/logger.util', () => ({
	Logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		businessLogic: vi.fn(),
		databaseQuery: vi.fn(),
		initialize: vi.fn(),
	},
}))

let lensesRepository: InMemoryLensesRepository
let lensesService: LensesService

describe('Quote Lenses Service', () => {
	beforeEach(() => {
		lensesRepository = new InMemoryLensesRepository()
		lensesService = new LensesService(lensesRepository)

		// Add a prescription range for testing (4-2 / 4-2)
		const range42 = lensesRepository.addPrescriptionRange({
			code: '42-42',
			description: 'Hasta 4 esf / 2 cil en ambos ojos',
			minEyeMaxSphere: 4,
			minEyeMaxCylinder: 2,
			maxEyeMaxSphere: 4,
			maxEyeMaxCylinder: 2,
		})

		// Add a prescription range for testing (4-4 / 4-4)
		const range44 = lensesRepository.addPrescriptionRange({
			code: '44-44',
			description: 'Hasta 4 esf / 4 cil en ambos ojos',
			minEyeMaxSphere: 4,
			minEyeMaxCylinder: 4,
			maxEyeMaxSphere: 4,
			maxEyeMaxCylinder: 4,
		})

		// Add products for range 42-42
		lensesRepository.addLensProduct({
			sku: 'ORG-MONO-42-CERRADO',
			name: 'Monofocal Orgánico Marco Cerrado',
			material: 'organico',
			tipo: 'monofocal',
			frameType: 'cerrado',
			hasAntiReflective: false,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 50000,
			basePrice: 80000,
			finalPrice: 100000,
			deliveryDays: 5,
			observations: null,
			available: true,
			prescriptionRangeId: range42.id,
		})

		lensesRepository.addLensProduct({
			sku: 'ORG-MONO-42-CERRADO-AR',
			name: 'Monofocal Orgánico Marco Cerrado con Antirreflejo',
			material: 'organico',
			tipo: 'monofocal',
			frameType: 'cerrado',
			hasAntiReflective: true,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 65000,
			basePrice: 95000,
			finalPrice: 120000,
			deliveryDays: 5,
			observations: null,
			available: true,
			prescriptionRangeId: range42.id,
		})

		// Add product with blue filter
		lensesRepository.addLensProduct({
			sku: 'ORG-MONO-42-CERRADO-BF',
			name: 'Monofocal Orgánico Marco Cerrado con Filtro Azul',
			material: 'organico',
			tipo: 'monofocal',
			frameType: 'cerrado',
			hasAntiReflective: false,
			hasBlueFilter: true,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 70000,
			basePrice: 100000,
			finalPrice: 130000,
			deliveryDays: 7,
			observations: null,
			available: true,
			prescriptionRangeId: range42.id,
		})

		// Add unavailable product (should not appear in results)
		lensesRepository.addLensProduct({
			sku: 'ORG-MONO-42-CERRADO-UNAVAIL',
			name: 'Producto No Disponible',
			material: 'organico',
			tipo: 'monofocal',
			frameType: 'cerrado',
			hasAntiReflective: false,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 50000,
			basePrice: 80000,
			finalPrice: 100000,
			deliveryDays: 5,
			observations: null,
			available: false,
			prescriptionRangeId: range42.id,
		})

		// Add product for different frame type
		lensesRepository.addLensProduct({
			sku: 'ORG-MONO-42-ALAIRE',
			name: 'Monofocal Orgánico Marco Al Aire',
			material: 'organico',
			tipo: 'monofocal',
			frameType: 'al_aire',
			hasAntiReflective: false,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 55000,
			basePrice: 85000,
			finalPrice: 110000,
			deliveryDays: 5,
			observations: null,
			available: true,
			prescriptionRangeId: range42.id,
		})

		// Add product for range 44-44
		lensesRepository.addLensProduct({
			sku: 'ORG-MONO-44-CERRADO',
			name: 'Monofocal Orgánico Marco Cerrado (4-4)',
			material: 'organico',
			tipo: 'monofocal',
			frameType: 'cerrado',
			hasAntiReflective: false,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 60000,
			basePrice: 90000,
			finalPrice: 115000,
			deliveryDays: 5,
			observations: null,
			available: true,
			prescriptionRangeId: range44.id,
		})
	})

	describe('Prescription Normalization', () => {
		it('should normalize prescription values to 0.25 increments', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.12, cylinder: -0.89 },
					oi: { sphere: 1.99, cylinder: -1.31 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.originalPrescription).toEqual({
				od: { sphere: 2.12, cylinder: -0.89 },
				oi: { sphere: 1.99, cylinder: -1.31 },
			})
			expect(result.meta.normalizedPrescription).toEqual({
				od: { sphere: 2.0, cylinder: -1.0 },
				oi: { sphere: 2.0, cylinder: -1.25 },
			})
		})

		it('should handle exact 0.25 values without modification', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.25, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.5 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.normalizedPrescription).toEqual({
				od: { sphere: 2.25, cylinder: -1.0 },
				oi: { sphere: 2.0, cylinder: -1.5 },
			})
		})

		it('should handle zero values correctly', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 0, cylinder: 0 },
					oi: { sphere: 0, cylinder: 0 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.normalizedPrescription).toEqual({
				od: { sphere: 0, cylinder: 0 },
				oi: { sphere: 0, cylinder: 0 },
			})
		})

		it('should handle negative values correctly', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: -3.12, cylinder: -1.89 },
					oi: { sphere: -2.37, cylinder: -0.63 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.normalizedPrescription).toEqual({
				od: { sphere: -3.0, cylinder: -2.0 },
				oi: { sphere: -2.25, cylinder: -0.75 },
			})
		})
	})

	describe('Prescription Range Selection', () => {
		it('should find correct prescription range for values within limits', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 3.0, cylinder: -1.5 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.prescriptionRangeUsed.code).toBe('42-42')
			expect(result.meta.prescriptionRangeUsed.description).toBe('Hasta 4 esf / 2 cil en ambos ojos')
		})

		it('should select smallest matching range', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 4.0, cylinder: -3.0 },
					oi: { sphere: 3.5, cylinder: -2.5 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.prescriptionRangeUsed.code).toBe('44-44')
		})

		it('should throw error when no range covers prescription', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 8.0, cylinder: -6.0 },
					oi: { sphere: 7.5, cylinder: -5.5 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			await expect(() => lensesService.quoteLenses(request)).rejects.toBeInstanceOf(
				PrescriptionRangeNotFoundException,
			)
		})

		it('should use absolute values for prescription comparison', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: -2.0, cylinder: -1.0 },
					oi: { sphere: -3.0, cylinder: -1.5 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.prescriptionRangeUsed.code).toBe('42-42')
		})
	})

	describe('Product Filtering', () => {
		it('should return only products matching frameType', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.results.length).toBeGreaterThan(0)
			expect(result.results.every((p) => p.frameType === 'cerrado')).toBe(true)
		})

		it('should filter by hasBlueFilter when specified', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
					hasBlueFilter: true,
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.results.length).toBe(1)
			expect(result.results[0].features.hasBlueFilter).toBe(true)
			expect(result.results[0].sku).toBe('ORG-MONO-42-CERRADO-BF')
		})

		it('should filter by hasAntiReflective when specified', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
					hasAntiReflective: true,
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.results.length).toBe(1)
			expect(result.results[0].features.hasAntiReflective).toBe(true)
			expect(result.results[0].sku).toBe('ORG-MONO-42-CERRADO-AR')
		})

		it('should exclude unavailable products', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.results.every((p) => p.sku !== 'ORG-MONO-42-CERRADO-UNAVAIL')).toBe(true)
		})

		it('should return empty results when no products match filters', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
					material: 'policarbonato',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.results).toEqual([])
			expect(result.meta.totalResults).toBe(0)
		})
	})

	describe('Product Sorting', () => {
		it('should sort products by finalPrice ascending', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.results.length).toBeGreaterThan(1)
			for (let i = 0; i < result.results.length - 1; i++) {
				expect(result.results[i].pricing.finalPrice).toBeLessThanOrEqual(
					result.results[i + 1].pricing.finalPrice,
				)
			}
		})
	})

	describe('Response Format', () => {
		it('should return correct response structure', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result).toHaveProperty('results')
			expect(result).toHaveProperty('meta')
			expect(result.meta).toHaveProperty('originalPrescription')
			expect(result.meta).toHaveProperty('normalizedPrescription')
			expect(result.meta).toHaveProperty('prescriptionRangeUsed')
			expect(result.meta).toHaveProperty('totalResults')
			expect(result.meta).toHaveProperty('filtersApplied')
		})

		it('should map product data correctly to response format', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
					hasAntiReflective: false,
					hasBlueFilter: false,
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.results.length).toBe(1)
			const product = result.results[0]

			expect(product).toHaveProperty('id')
			expect(product).toHaveProperty('sku')
			expect(product).toHaveProperty('name')
			expect(product).toHaveProperty('material')
			expect(product).toHaveProperty('tipo')
			expect(product).toHaveProperty('frameType')
			expect(product).toHaveProperty('features')
			expect(product).toHaveProperty('pricing')
			expect(product).toHaveProperty('deliveryDays')
			expect(product).toHaveProperty('observations')

			expect(product.features).toHaveProperty('hasAntiReflective')
			expect(product.features).toHaveProperty('hasBlueFilter')
			expect(product.features).toHaveProperty('isPhotochromic')
			expect(product.features).toHaveProperty('hasUVProtection')
			expect(product.features).toHaveProperty('isPolarized')
			expect(product.features).toHaveProperty('isMirrored')

			expect(product.pricing).toHaveProperty('basePrice')
			expect(product.pricing).toHaveProperty('finalPrice')
			expect(product.pricing).not.toHaveProperty('costPrice')
		})

		it('should include correct totalResults count', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
				},
			}

			const result = await lensesService.quoteLenses(request)

			expect(result.meta.totalResults).toBe(result.results.length)
		})

		it('should include applied filters in meta', async () => {
			const request: QuoteLensesRequest = {
				prescription: {
					od: { sphere: 2.0, cylinder: -1.0 },
					oi: { sphere: 2.0, cylinder: -1.0 },
				},
				filters: {
					frameType: 'cerrado',
					hasBlueFilter: true,
				},
			}

			const result = await lensesService.quoteLenses(request)

											expect(result.meta.filtersApplied).toEqual({
											frameType: 'cerrado',
											hasBlueFilter: true,
										})
									})
								})
							
								describe('Auxiliary Methods', () => {
									it('normalizeValue should round to the nearest 0.25 increment', () => {
										// Test normalization through the public API
										const request = {
											prescription: {
												od: { sphere: 2.12, cylinder: 0 },
												oi: { sphere: 2.13, cylinder: 0 }
											},
											filters: { frameType: 'cerrado' as const }
										}
										
										// The normalization happens internally in quoteLenses
										// We can verify it by checking the meta information
										return lensesService.quoteLenses(request).then(result => {
											expect(result.meta.normalizedPrescription.od.sphere).toBe(2.00)
											expect(result.meta.normalizedPrescription.oi.sphere).toBe(2.25)
										})
									})
							
									it('normalizePrescription should normalize both eyes\'s sphere and cylinder', () => {
										const request = {
											prescription: {
												od: { sphere: -3.76, cylinder: -2.13 },
												oi: { sphere: -4.00, cylinder: -2.00 }
											},
											filters: { frameType: 'cerrado' as const }
										}
										
										return lensesService.quoteLenses(request).then(result => {
											expect(result.meta.normalizedPrescription).toEqual({
												od: { sphere: -3.75, cylinder: -2.25 },
												oi: { sphere: -4.00, cylinder: -2.00 }
											})
										})
									})
							
									it('mapLensProductToResponse should correctly map product data to response format', () => {
										// Test the mapping through the public API by creating a product
										const productData = {
											sku: 'TEST-SKU',
											name: 'Test Product',
											material: 'organico' as const,
											tipo: 'monofocal' as const,
											frameType: 'cerrado' as const,
											hasAntiReflective: true,
											hasBlueFilter: false,
											isPhotochromic: false,
											hasUVProtection: true,
											isPolarized: false,
											isMirrored: false,
											basePrice: 100,
											finalPrice: 200,
											deliveryDays: 3,
											observations: 'Some observations',
											available: true,
											prescriptionRangeId: lensesRepository.prescriptionRanges[0].id, // Use actual UUID from setup
										}
										
										return lensesService.createLensProduct(productData).then(response => {
											expect(response).toHaveProperty('id')
											expect(response.sku).toBe('TEST-SKU')
											expect(response.name).toBe('Test Product')
											expect(response.material).toBe('organico')
											expect(response.tipo).toBe('monofocal')
											expect(response.frameType).toBe('cerrado')
											expect(response.features).toEqual({
												hasAntiReflective: true,
												hasBlueFilter: false,
												isPhotochromic: false,
												hasUVProtection: true,
												isPolarized: false,
												isMirrored: false,
											})
											expect(response.pricing).toEqual({
												basePrice: 100,
												finalPrice: 200,
											})
											expect(response.deliveryDays).toBe(3)
											expect(response.observations).toBe('Some observations')
											expect(response.available).toBe(true)
											expect(response.prescriptionRangeId).toBe(lensesRepository.prescriptionRanges[0].id)
											expect(response.createdAt).toBeDefined()
											expect(response.updatedAt).toBeDefined()
										})
									})
								})
							})
