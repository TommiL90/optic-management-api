import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

async function swaggerPluginFn(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Optic Management API',
        description: 'API for optic management system',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
}

export const swaggerPlugin = fp(swaggerPluginFn, {
  name: 'swagger-plugin',
  fastify: '5.x',
});
