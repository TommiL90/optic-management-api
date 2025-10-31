import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { lensesRoutes } from '@/modules/lenses/lenses.routes.ts'

async function lensesPluginFn(
	fastify: FastifyInstance,
	_options: FastifyPluginOptions,
): Promise<void> {
	await fastify.register(lensesRoutes, { prefix: '/lenses' })
}

export const lensesPlugin = fp(lensesPluginFn, {
	name: 'lenses-plugin',
	fastify: '5.x',
})
