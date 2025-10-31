import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { usersRoutes } from './users.routes';

async function usersPluginFn(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  await fastify.register(usersRoutes);
}

export const usersPlugin = fp(usersPluginFn, {
  name: 'users-plugin',
  fastify: '5.x',
});
