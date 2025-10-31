import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getHealthHandler } from './health.handlers.ts';
import { healthResponseSchema } from './health.schemas.ts';

export async function healthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: healthResponseSchema,
        },
      },
    },
    getHealthHandler
  );
}
