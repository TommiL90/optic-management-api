import type { FastifyInstance } from 'fastify'
import { 
	quoteLensesHandler,
	createLensProductHandler,
	findLensProductByIdHandler,
	findAllLensProductsHandler,
	updateLensProductHandler,
	deleteLensProductHandler
} from '@/modules/lenses/lenses.handlers.ts'
import {
	quoteLensesResponseSchema,
	quoteLensesSchema,
	createLensProductSchema,
	updateLensProductSchema,
	lensProductIdParamSchema,
	lensProductResponseSchema,
	lensProductsResponseSchema,
} from '@/modules/lenses/schemas/lenses.schemas.ts'

export async function lensesRoutes(app: FastifyInstance) {
	// Quote lenses endpoint
	app.post(
		'/quote',
		{
			schema: {
				description: 'Cotizar lentes según receta oftalmológica',
				tags: ['lenses'],
				body: quoteLensesSchema.body,
				response: {
					200: quoteLensesResponseSchema,
				},
			},
		},
		quoteLensesHandler,
	)

	// CRUD endpoints for lens products
	app.post(
		'/products',
		{
			schema: {
				description: 'Crear un nuevo producto de lente',
				tags: ['lenses'],
				body: createLensProductSchema,
				response: {
					201: lensProductResponseSchema,
				},
			},
		},
		createLensProductHandler,
	)

	app.get(
		'/products',
		{
			schema: {
				description: 'Obtener todos los productos de lentes (sin paginación)',
				tags: ['lenses'],
				response: {
					200: lensProductsResponseSchema,
				},
			},
		},
		findAllLensProductsHandler,
	)

	app.get(
		'/products/:id',
		{
			schema: {
				description: 'Obtener un producto de lente por ID',
				tags: ['lenses'],
				params: lensProductIdParamSchema,
				response: {
					200: lensProductResponseSchema,
				},
			},
		},
		findLensProductByIdHandler,
	)

	app.put(
		'/products/:id',
		{
			schema: {
				description: 'Actualizar un producto de lente',
				tags: ['lenses'],
				params: lensProductIdParamSchema,
				body: updateLensProductSchema,
				response: {
					200: lensProductResponseSchema,
				},
			},
		},
		updateLensProductHandler,
	)

	app.delete(
		'/products/:id',
		{
			schema: {
				description: 'Eliminar un producto de lente',
				tags: ['lenses'],
				params: lensProductIdParamSchema,
			},
		},
		deleteLensProductHandler,
	)
}
