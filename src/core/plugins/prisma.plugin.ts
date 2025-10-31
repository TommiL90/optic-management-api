import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { prisma, prismaService } from '@/core/database/prisma.client.ts';

/**
 * Prisma plugin for Fastify
 * Provides a singleton PrismaClient instance across the application
 * and ensures proper connection lifecycle management
 */
async function prismaPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Connect to the database
  await prismaService.connect();

  // Decorate Fastify instance with Prisma client
  fastify.decorate('prisma', prisma);

  // Add hook to close connection when Fastify shuts down
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Closing Prisma connection');
    await prismaService.disconnect();
  });

  fastify.log.info('Prisma client connected');
}

export const prismaClientPlugin = fp(prismaPlugin, {
  name: 'prisma-client',
});

// Type augmentation for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
