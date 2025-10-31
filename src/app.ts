import { fastifyCors } from '@fastify/cors';
import { fastifyMultipart } from '@fastify/multipart';
import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from '@/config/env.ts';
import { createErrorHandler } from '@/core/errors/error-handler.ts';
import { swaggerPlugin } from '@/core/plugins/swagger.plugin.ts';
import { loggerPlugin } from '@/core/plugins/logger.plugin.ts';
import { prismaClientPlugin } from '@/core/plugins/prisma.plugin.ts';
import { healthPlugin } from '@/modules/health/health.plugin.ts';
import { usersPlugin } from '@/modules/users/users.plugin.ts';
import { lensesPlugin } from '@/modules/lenses/lenses.plugin.ts';
import prescriptionRangesPlugin from '@/modules/prescription-ranges/prescription-ranges.plugin.ts';

export const app = fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      }
    } : undefined,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
        },
        remoteAddress: req.ip,
        remotePort: req.socket?.remotePort,
      }),
      res: (res) => {
        const contentType = res.getHeader?.('content-type');
        const contentLength = res.getHeader?.('content-length');
        return {
          statusCode: res.statusCode,
          headers: {
            'content-type': typeof contentType === 'string' ? contentType : undefined,
            'content-length': typeof contentLength === 'string' ? contentLength : undefined,
          },
        };
      },
    },
  },
  disableRequestLogging: true
}).withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: '*',
});

app.register(fastifyMultipart);

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

// Error handler global
app.setErrorHandler(createErrorHandler());

// Plugin de Logger
app.register(loggerPlugin);

// Plugin de Prisma
app.register(prismaClientPlugin);

// Plugin de Swagger
app.register(swaggerPlugin);

// Módulos de la aplicación
app.register(healthPlugin);
app.register(usersPlugin);
app.register(lensesPlugin);
app.register(prescriptionRangesPlugin);
