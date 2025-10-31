import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { Logger } from '@/core/utils/logger.util.ts'

declare module 'fastify' {
	interface FastifyInstance {
		logger: typeof Logger
	}
}

export async function loggerPlugin(
	fastify: FastifyInstance,
	_options: FastifyPluginOptions,
): Promise<void> {
	// Inicializar el Logger estático
	Logger.initialize(fastify)
	
	// Registrar el logger para acceso desde fastify instance (opcional)
	fastify.decorate('logger', Logger)

	// Hook para logging compacto de responses (estilo NestJS)
	fastify.addHook('onResponse', async (request, reply) => {
		// Filtrar rutas estáticas de Swagger
		if (request.url.startsWith('/docs/static/')) {
			return
		}

		const statusCode = reply.statusCode
		const responseTime = reply.elapsedTime?.toFixed(0) || '0'
		const method = request.method
		const url = request.url

		// Log con contexto estructurado usando LoggerService estático
		const logData = {
			userAgent: request.headers['user-agent'],
			ip: request.ip
		}

		// Usar el método específico del Logger
		Logger.httpRequest(method, url, statusCode, parseFloat(responseTime), logData)
	})
}
