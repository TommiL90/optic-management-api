import { z } from 'zod'

/**
 * Schema for a single prescription range response
 */
export const prescriptionRangeResponseSchema = z.object({
	id: z.string().uuid().describe('ID del rango de prescripción'),
	code: z.string().describe('Código del rango (ej: 42-42, 42-44)'),
	description: z.string().describe('Descripción del rango'),
	minEyeMaxSphere: z.number().describe('Esfera máxima del ojo con menor complejidad'),
	minEyeMaxCylinder: z.number().describe('Cilindro máximo del ojo con menor complejidad'),
	maxEyeMaxSphere: z.number().describe('Esfera máxima del ojo con mayor complejidad'),
	maxEyeMaxCylinder: z.number().describe('Cilindro máximo del ojo con mayor complejidad'),
	createdAt: z.string().datetime().describe('Fecha de creación'),
	updatedAt: z.string().datetime().describe('Fecha de última actualización'),
})

/**
 * Schema for the list of prescription ranges response
 */
export const prescriptionRangesResponseSchema = z.object({
	ranges: z.array(prescriptionRangeResponseSchema).describe('Lista de rangos de prescripción'),
})

// Type exports
export type PrescriptionRangeResponse = z.infer<typeof prescriptionRangeResponseSchema>
export type PrescriptionRangesResponse = z.infer<typeof prescriptionRangesResponseSchema>
