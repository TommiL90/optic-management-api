import { FastifyRequest, FastifyReply } from 'fastify';
import { HealthResponse } from './health.schemas.ts';
import { env } from '@/config/env.ts';

export async function getHealthHandler(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<HealthResponse> {
  request.log.info('Health check requested');
  
  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
  };

  request.log.info({ healthData }, 'Health check completed');
  return healthData;
}
