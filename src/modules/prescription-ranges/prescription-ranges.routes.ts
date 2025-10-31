import type { FastifyInstance } from 'fastify'
import { getAllPrescriptionRangesHandler } from '@/modules/prescription-ranges/prescription-ranges.handlers.ts'
import { prescriptionRangesResponseSchema } from '@/modules/prescription-ranges/schemas/prescription-ranges.schemas.ts'

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
}
