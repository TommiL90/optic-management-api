import type { FastifyReply, FastifyRequest } from 'fastify'
import { Logger } from '@/core/utils/logger.util.ts'
import { makeLensesService } from '@/modules/lenses/factories/make-lenses-service.ts'
import type { 
	QuoteLensesRequest, 
	CreateLensProduct, 
	UpdateLensProduct, 
	LensProductIdParam 
} from '@/modules/lenses/schemas/lenses.schemas.ts'

export async function quoteLensesHandler(
	request: FastifyRequest<{ Body: QuoteLensesRequest }>,
	reply: FastifyReply,
) {
	Logger.info('LensesController: quoteLensesHandler started', {
		method: request.method,
		url: request.url,
		body: request.body
	})

	try {
		const lensesService = makeLensesService()
		const result = await lensesService.quoteLenses(request.body)
		
		Logger.info('LensesController: quoteLensesHandler completed', {
			method: request.method,
			url: request.url,
			result: { totalResults: result.results.length }
		})

		return reply.status(200).send(result)
	} catch (error) {
		Logger.error('LensesController: quoteLensesHandler failed', {
			method: request.method,
			url: request.url,
			error: error instanceof Error ? error.message : String(error)
		})
		throw error
	}
}

export async function createLensProductHandler(
	request: FastifyRequest<{ Body: CreateLensProduct }>,
	reply: FastifyReply,
) {
	Logger.info('LensesController: createLensProductHandler started', {
		method: request.method,
		url: request.url,
		body: request.body
	})

	try {
		const lensesService = makeLensesService()
		const result = await lensesService.createLensProduct(request.body)
		
		Logger.info('LensesController: createLensProductHandler completed', {
			method: request.method,
			url: request.url,
			result: { productId: result.id, sku: result.sku }
		})

		return reply.status(201).header('Location', `/lenses/products/${result.id}`).send(result)
	} catch (error) {
		Logger.error('LensesController: createLensProductHandler failed', {
			method: request.method,
			url: request.url,
			error: error instanceof Error ? error.message : String(error)
		})
		throw error
	}
}

export async function findLensProductByIdHandler(
	request: FastifyRequest<{ Params: LensProductIdParam }>,
	reply: FastifyReply,
) {
	Logger.info('LensesController: findLensProductByIdHandler started', {
		method: request.method,
		url: request.url,
		params: request.params
	})

	try {
		const lensesService = makeLensesService()
		const result = await lensesService.findLensProductById(request.params.id)
		
		Logger.info('LensesController: findLensProductByIdHandler completed', {
			method: request.method,
			url: request.url,
			result: { productId: result.id, sku: result.sku }
		})

		return reply.status(200).send(result)
	} catch (error) {
		Logger.error('LensesController: findLensProductByIdHandler failed', {
			method: request.method,
			url: request.url,
			error: error instanceof Error ? error.message : String(error)
		})
		throw error
	}
}

export async function findAllLensProductsHandler(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	Logger.info('LensesController: findAllLensProductsHandler started', {
		method: request.method,
		url: request.url
	})

	try {
		const lensesService = makeLensesService()
		const result = await lensesService.findAllLensProducts()
		
		Logger.info('LensesController: findAllLensProductsHandler completed', {
			method: request.method,
			url: request.url,
			result: { count: result.products.length }
		})

		return reply.status(200).send(result)
	} catch (error) {
		Logger.error('LensesController: findAllLensProductsHandler failed', {
			method: request.method,
			url: request.url,
			error: error instanceof Error ? error.message : String(error)
		})
		throw error
	}
}

export async function updateLensProductHandler(
	request: FastifyRequest<{ Params: LensProductIdParam; Body: UpdateLensProduct }>,
	reply: FastifyReply,
) {
	Logger.info('LensesController: updateLensProductHandler started', {
		method: request.method,
		url: request.url,
		params: request.params,
		body: request.body
	})

	try {
		const lensesService = makeLensesService()
		const result = await lensesService.updateLensProduct(request.params.id, request.body)
		
		Logger.info('LensesController: updateLensProductHandler completed', {
			method: request.method,
			url: request.url,
			result: { productId: result.id, sku: result.sku }
		})

		return reply.status(200).send(result)
	} catch (error) {
		Logger.error('LensesController: updateLensProductHandler failed', {
			method: request.method,
			url: request.url,
			error: error instanceof Error ? error.message : String(error)
		})
		throw error
	}
}

export async function deleteLensProductHandler(
	request: FastifyRequest<{ Params: LensProductIdParam }>,
	reply: FastifyReply,
) {
	Logger.info('LensesController: deleteLensProductHandler started', {
		method: request.method,
		url: request.url,
		params: request.params
	})

	try {
		const lensesService = makeLensesService()
		await lensesService.deleteLensProduct(request.params.id)
		
		Logger.info('LensesController: deleteLensProductHandler completed', {
			method: request.method,
			url: request.url,
			result: { productId: request.params.id }
		})

		return reply.status(204).send()
	} catch (error) {
		Logger.error('LensesController: deleteLensProductHandler failed', {
			method: request.method,
			url: request.url,
			error: error instanceof Error ? error.message : String(error)
		})
		throw error
	}
}
