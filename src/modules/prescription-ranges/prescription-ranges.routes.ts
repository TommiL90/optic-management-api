import type { FastifyInstance } from 'fastify'
import {
	getAllPrescriptionRangesHandler,
	seedPrescriptionRangesHandler,
} from '@/modules/prescription-ranges/prescription-ranges.handlers.ts'
import {
	prescriptionRangesResponseSchema,
	seedPrescriptionRangesSchema,
	seedPrescriptionRangesResponseSchema,
} from '@/modules/prescription-ranges/schemas/prescription-ranges.schemas.ts'

/**
 * Prescription Ranges Routes
 * Defines all routes for prescription ranges operations
 */
export async function prescriptionRangesRoutes(app: FastifyInstance) {
	/**
	 * GET /prescription-ranges
	 * Get all prescription ranges
	 */
	app.get(
		'/prescription-ranges',
		{
			schema: {
				description: 'Get all prescription ranges',
				tags: ['Prescription Ranges'],
				response: {
					200: prescriptionRangesResponseSchema,
				},
			},
		},
		getAllPrescriptionRangesHandler,
	)

	/**
	 * POST /prescription-ranges/seed
	 * Seed prescription ranges (upsert by code)
	 */
	app.post(
		'/prescription-ranges/seed',
		{
			schema: {
				description: 'Hacer seed de rangos de prescripción (crea o actualiza por código)',
				tags: ['Prescription Ranges'],
				body: seedPrescriptionRangesSchema,
				response: {
					200: seedPrescriptionRangesResponseSchema,
				},
			},
		},
		seedPrescriptionRangesHandler,
	)
}
