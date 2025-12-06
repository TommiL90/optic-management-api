import type { FastifyReply, FastifyRequest } from 'fastify'
import { makePrescriptionRangesService } from '@/modules/prescription-ranges/factories/make-prescription-ranges-service.ts'
import type { SeedPrescriptionRangesRequest } from '@/modules/prescription-ranges/schemas/prescription-ranges.schemas.ts'

/**
 * Handler to get all prescription ranges
 * @param _request - Fastify request (unused)
 * @param reply - Fastify reply
 * @returns Promise with prescription ranges response
 */
export async function getAllPrescriptionRangesHandler(
	_request: FastifyRequest,
	reply: FastifyReply,
) {
	const prescriptionRangesService = makePrescriptionRangesService()
	const result = await prescriptionRangesService.findAllRanges()
	return reply.status(200).send(result)
}

/**
 * Handler to seed prescription ranges
 * @param request - Fastify request with body containing ranges array
 * @param reply - Fastify reply
 * @returns Promise with seed response
 */
export async function seedPrescriptionRangesHandler(
	request: FastifyRequest<{ Body: SeedPrescriptionRangesRequest }>,
	reply: FastifyReply,
) {
	const prescriptionRangesService = makePrescriptionRangesService()
	const { ranges } = request.body
	const result = await prescriptionRangesService.seedRanges(ranges)
	return reply.status(200).send(result)
}
