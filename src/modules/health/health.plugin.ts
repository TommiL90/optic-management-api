import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { healthRoutes } from './health.routes.ts';
import fp from 'fastify-plugin';

async function healthPluginFn(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  await fastify.register(healthRoutes);
}

export const healthPlugin = fp(healthPluginFn, {
  name: 'health-plugin',
  fastify: '5.x',
});
