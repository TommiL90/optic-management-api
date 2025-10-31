import type { FastifyReply, FastifyRequest } from 'fastify'
import { makePrescriptionRangesService } from '@/modules/prescription-ranges/factories/make-prescription-ranges-service.ts'

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
