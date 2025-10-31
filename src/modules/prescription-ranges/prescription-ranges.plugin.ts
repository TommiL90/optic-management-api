import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { prescriptionRangesRoutes } from '@/modules/prescription-ranges/prescription-ranges.routes.ts'

/**
 * Prescription Ranges Plugin
 * Registers prescription ranges routes in the Fastify application
 */
const prescriptionRangesPlugin: FastifyPluginAsync = async (app) => {
	await app.register(prescriptionRangesRoutes)
}

export default fp(prescriptionRangesPlugin, {
	name: 'prescription-ranges-plugin',
})
