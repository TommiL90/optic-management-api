import { z } from 'zod'

// Enum constants (single source of truth)
export const LENS_MATERIALS = ['organico', 'policarbonato', 'mineral', 'adelgazado'] as const
export const LENS_TYPES = ['monofocal', 'bifocal', 'multifocal'] as const
export const FRAME_TYPES = ['cerrado', 'semicerrado', 'al_aire'] as const

const eyePrescriptionSchema = z.object({
	sphere: z.number().describe('Esfera del ojo'),
	cylinder: z.number().describe('Cilindro del ojo'),
})

const prescriptionSchema = z.object({
	od: eyePrescriptionSchema.describe('Ojo derecho'),
	oi: eyePrescriptionSchema.describe('Ojo izquierdo'),
})

const filtersSchema = z.object({
	frameType: z.enum(FRAME_TYPES).describe('Tipo de marco (obligatorio)'),
	material: z
		.enum(LENS_MATERIALS)
		.optional()
		.describe('Material del lente'),
	hasBlueFilter: z.boolean().optional().describe('Filtro azul'),
	isPhotochromic: z.boolean().optional().describe('Fotocromático'),
	hasAntiReflective: z.boolean().optional().describe('Antirreflejo'),
	isPolarized: z.boolean().optional().describe('Polarizado'),
	tipo: z
		.enum(LENS_TYPES)
		.optional()
		.describe('Tipo de lente'),
})

export const quoteLensesSchema = {
	body: z.object({
		prescription: prescriptionSchema,
		filters: filtersSchema,
	}),
}

const lensProductFeaturesSchema = z.object({
	hasAntiReflective: z.boolean().describe('Tiene antirreflejo'),
	hasBlueFilter: z.boolean().describe('Tiene filtro azul'),
	isPhotochromic: z.boolean().describe('Es fotocromático'),
	hasUVProtection: z.boolean().describe('Tiene protección UV'),
	isPolarized: z.boolean().describe('Es polarizado'),
	isMirrored: z.boolean().describe('Es espejado'),
})

const lensPricingSchema = z.object({
	basePrice: z.number().describe('Precio base del cristal'),
	finalPrice: z.number().describe('Precio final al público'),
})

export const lensProductResponseSchema = z.object({
	id: z.string().uuid().describe('ID del producto'),
	sku: z.string().describe('SKU del producto'),
	name: z.string().describe('Nombre del producto'),
	material: z.enum(LENS_MATERIALS).describe('Material del lente'),
	tipo: z.enum(LENS_TYPES).describe('Tipo de lente'),
	frameType: z.enum(FRAME_TYPES).describe('Tipo de marco'),
	features: lensProductFeaturesSchema.describe('Características del lente'),
	pricing: lensPricingSchema.describe('Precios'),
	deliveryDays: z.number().describe('Días hábiles de entrega'),
	observations: z.string().nullable().describe('Observaciones'),
	available: z.boolean().describe('Disponible'),
	prescriptionRangeId: z.string().uuid().describe('ID del rango de prescripción'),
	createdAt: z.string().datetime().describe('Fecha de creación'),
	updatedAt: z.string().datetime().describe('Fecha de última actualización'),
})

const prescriptionRangeUsedSchema = z.object({
	code: z.string().describe('Código del rango (ej: 42-42)'),
	description: z.string().describe('Descripción del rango'),
})

const quoteLensesMetaSchema = z.object({
	originalPrescription: prescriptionSchema.describe('Prescripción original ingresada'),
	normalizedPrescription: prescriptionSchema.describe('Prescripción normalizada (paso 0.25)'),
	prescriptionRangeUsed: prescriptionRangeUsedSchema.describe('Rango de prescripción usado'),
	totalResults: z.number().describe('Total de productos encontrados'),
	filtersApplied: z.record(z.string(), z.any()).describe('Filtros aplicados'),
})

export const quoteLensesResponseSchema = z.object({
	results: z.array(lensProductResponseSchema).describe('Lista de productos disponibles'),
	meta: quoteLensesMetaSchema.describe('Metadata de la cotización'),
})

export type QuoteLensesRequest = z.infer<typeof quoteLensesSchema.body>
export type EyePrescription = z.infer<typeof eyePrescriptionSchema>
export type Prescription = z.infer<typeof prescriptionSchema>
export type Filters = z.infer<typeof filtersSchema>
export type LensProductResponse = z.infer<typeof lensProductResponseSchema>
export type QuoteLensesResponse = z.infer<typeof quoteLensesResponseSchema>

export interface PrescriptionRangeData {
	id: string
	code: string
	description: string
	minEyeMaxSphere: number
	minEyeMaxCylinder: number
	maxEyeMaxSphere: number
	maxEyeMaxCylinder: number
	createdAt: Date
	updatedAt: Date
}

export interface LensProductData {
	id: string
	sku: string
	name: string
	material: typeof LENS_MATERIALS[number]
	tipo: typeof LENS_TYPES[number]
	frameType: typeof FRAME_TYPES[number]
	hasAntiReflective: boolean
	hasBlueFilter: boolean
	isPhotochromic: boolean
	hasUVProtection: boolean
	isPolarized: boolean
	isMirrored: boolean
	costPrice: number | null
	basePrice: number
	finalPrice: number
	deliveryDays: number
	observations: string | null
	available: boolean
	prescriptionRangeId: string
	createdAt: Date
	updatedAt: Date
}

// CRUD Schemas
export const createLensProductSchema = z.object({
	sku: z.string().min(1, 'SKU is required').describe('SKU del producto'),
	name: z.string().min(1, 'Name is required').describe('Nombre del producto'),
	material: z.enum(LENS_MATERIALS).describe('Material del lente'),
	tipo: z.enum(LENS_TYPES).describe('Tipo de lente'),
	frameType: z.enum(FRAME_TYPES).describe('Tipo de marco'),
	hasAntiReflective: z.boolean().describe('Tiene antirreflejo'),
	hasBlueFilter: z.boolean().describe('Tiene filtro azul'),
	isPhotochromic: z.boolean().describe('Es fotocromático'),
	hasUVProtection: z.boolean().describe('Tiene protección UV'),
	isPolarized: z.boolean().describe('Es polarizado'),
	isMirrored: z.boolean().describe('Es espejado'),
	costPrice: z.number().min(0).nullable().optional().describe('Precio de costo'),
	basePrice: z.number().min(0).describe('Precio base del cristal'),
	finalPrice: z.number().min(0).describe('Precio final al público'),
	deliveryDays: z.number().min(0).describe('Días hábiles de entrega'),
	observations: z.string().nullable().optional().describe('Observaciones'),
	available: z.boolean().default(true).describe('Disponible'),
	prescriptionRangeId: z.string().uuid().describe('ID del rango de prescripción'),
})

export const updateLensProductSchema = z.object({
	sku: z.string().min(1, 'SKU is required').optional().describe('SKU del producto'),
	name: z.string().min(1, 'Name is required').optional().describe('Nombre del producto'),
	material: z.enum(LENS_MATERIALS).optional().describe('Material del lente'),
	tipo: z.enum(LENS_TYPES).optional().describe('Tipo de lente'),
	frameType: z.enum(FRAME_TYPES).optional().describe('Tipo de marco'),
	hasAntiReflective: z.boolean().optional().describe('Tiene antirreflejo'),
	hasBlueFilter: z.boolean().optional().describe('Tiene filtro azul'),
	isPhotochromic: z.boolean().optional().describe('Es fotocromático'),
	hasUVProtection: z.boolean().optional().describe('Tiene protección UV'),
	isPolarized: z.boolean().optional().describe('Es polarizado'),
	isMirrored: z.boolean().optional().describe('Es espejado'),
	costPrice: z.number().min(0).nullable().optional().describe('Precio de costo'),
	basePrice: z.number().min(0).optional().describe('Precio base del cristal'),
	finalPrice: z.number().min(0).optional().describe('Precio final al público'),
	deliveryDays: z.number().min(0).optional().describe('Días hábiles de entrega'),
	observations: z.string().nullable().optional().describe('Observaciones'),
	available: z.boolean().optional().describe('Disponible'),
	prescriptionRangeId: z.string().uuid().optional().describe('ID del rango de prescripción'),
})

export const lensProductIdParamSchema = z.object({
	id: z.string().uuid('Invalid lens product ID format').describe('Lens product unique identifier'),
})

// Response schemas

export const lensProductsResponseSchema = z.object({
	products: z.array(lensProductResponseSchema).describe('Lista de productos de lentes'),
})

// Type exports
export type CreateLensProduct = z.infer<typeof createLensProductSchema>
export type UpdateLensProduct = z.infer<typeof updateLensProductSchema>
export type LensProductIdParam = z.infer<typeof lensProductIdParamSchema>
export type LensProductsResponse = z.infer<typeof lensProductsResponseSchema>
