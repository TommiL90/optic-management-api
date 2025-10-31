import { FastifyPluginOptions } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createUserHandler, getUserByIdHandler, getUsersHandler, updateUserHandler, deleteUserHandler } from './users.handlers';
import {
  usersResponseSchema,
  createUserSchema,
  createUserResponseSchema,
  errorResponseSchema,
  userIdParamSchema,
  getUserByIdResponseSchema,
  updateUserSchema,
  updateUserResponseSchema,
  queryPaginationSchema,
  noContentResponseSchema,
} from './schemas/users.schemas';

export const usersRoutes: FastifyPluginAsyncZod = async (
  fastify,
  _options: FastifyPluginOptions
) => {
  fastify.post(
    '/users',
    {
      schema: {
        description: 'Create a new user',
        tags: ['users'],
        body: createUserSchema,
        response: {
          201: createUserResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createUserHandler
  );

  fastify.get(
    '/users/:id',
    {
      schema: {
        description: 'Get user by ID',
        tags: ['users'],
        params: userIdParamSchema,
        response: {
          200: getUserByIdResponseSchema,
          404: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    getUserByIdHandler
  );

  fastify.patch(
    '/users/:id',
    {
      schema: {
        description: 'Update user (partial)',
        tags: ['users'],
        params: userIdParamSchema,
        body: updateUserSchema,
        response: {
          200: updateUserResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    updateUserHandler
  );

  fastify.delete(
    '/users/:id',
    {
      schema: {
        description: 'Delete user',
        tags: ['users'],
        params: userIdParamSchema,
        response: {
          204: noContentResponseSchema,
          404: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    deleteUserHandler
  );

  fastify.get(
    '/users',
    {
      schema: {
        description: 'Get all users',
        tags: ['users'],
        querystring: queryPaginationSchema,
        response: {
          200: usersResponseSchema,
        },
      },
    },
    getUsersHandler
  );
}
