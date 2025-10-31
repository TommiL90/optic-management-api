import { FastifyRequest, FastifyReply } from 'fastify';
import { makeUserService } from './factories/make-user-service';
import { UsersResponse, CreateUserRequest, UserResponse, UserIdParam, UpdateUserRequest, QueryPagination } from './schemas/users.schemas';
import { Logger } from '@/core/utils/logger.util';
import { HttpException } from '@/core/errors/http-exception';

export async function createUserHandler(
  request: FastifyRequest<{ Body: CreateUserRequest }>,
  reply: FastifyReply
): Promise<void> {
  Logger.info('UsersHandler: createUserHandler started', {
    method: request.method,
    url: request.url,
  });
  try {
    const userService = makeUserService();
    const user = await userService.createUser(request.body);
    const response: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    reply.code(201).header('location', `/users/${user.id}`).send(response);
    Logger.info('UsersHandler: createUserHandler completed', {
      method: request.method,
      url: request.url,
      userId: user.id,
    });
  } catch (error) {
    Logger.error('UsersHandler: createUserHandler failed', {
      method: request.method,
      url: request.url,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getUserByIdHandler(
  request: FastifyRequest<{ Params: UserIdParam }>,
  _reply: FastifyReply
): Promise<UserResponse> {
  Logger.info('UsersHandler: getUserByIdHandler started', {
    method: request.method,
    url: request.url,
    userId: request.params.id,
  });
  try {
    const userService = makeUserService();
    const user = await userService.findUserById(request.params.id);
    if (!user) {
      throw new HttpException(404, 'NOT_FOUND', 'User not found');
    }
    const response: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    Logger.info('UsersHandler: getUserByIdHandler completed', {
      method: request.method,
      url: request.url,
      userId: user.id,
    });
    return response;
  } catch (error) {
    Logger.error('UsersHandler: getUserByIdHandler failed', {
      method: request.method,
      url: request.url,
      userId: request.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function updateUserHandler(
  request: FastifyRequest<{ Params: UserIdParam; Body: UpdateUserRequest }>,
  _reply: FastifyReply
): Promise<UserResponse> {
  Logger.info('UsersHandler: updateUserHandler started', {
    method: request.method,
    url: request.url,
    userId: request.params.id,
  });
  try {
    const userService = makeUserService();
    const user = await userService.updateUser(request.params.id, request.body);
    const response: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    Logger.info('UsersHandler: updateUserHandler completed', {
      method: request.method,
      url: request.url,
      userId: user.id,
    });
    return response;
  } catch (error) {
    Logger.error('UsersHandler: updateUserHandler failed', {
      method: request.method,
      url: request.url,
      userId: request.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function deleteUserHandler(
  request: FastifyRequest<{ Params: UserIdParam }>,
  reply: FastifyReply
): Promise<void> {
  Logger.info('UsersHandler: deleteUserHandler started', {
    method: request.method,
    url: request.url,
    userId: request.params.id,
  });
  try {
    const userService = makeUserService();
    await userService.deleteUser(request.params.id);
    reply.code(204).send();
    Logger.info('UsersHandler: deleteUserHandler completed', {
      method: request.method,
      url: request.url,
      userId: request.params.id,
    });
  } catch (error) {
    Logger.error('UsersHandler: deleteUserHandler failed', {
      method: request.method,
      url: request.url,
      userId: request.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getUsersHandler(
  request: FastifyRequest<{ Querystring: QueryPagination }>,
  _reply: FastifyReply
): Promise<UsersResponse> {
  Logger.info('UsersHandler: getUsersHandler started', {
    method: request.method,
    url: request.url,
    query: request.query
  });

  try {
    const userService = makeUserService();

    const { page, limit } = request.query;
    const baseUrl = `${request.protocol}://${request.hostname}${request.url.split('?')[0]}`;

    const result = await userService.findAllUsers(page, limit, baseUrl);

    const formattedUsers = result.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));

    const response: UsersResponse = {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: result.count,
        pages: result.pages,
        hasNext: !!result.nextPage,
        hasPrev: !!result.prevPage,
        nextPage: result.nextPage,
        prevPage: result.prevPage
      }
    };

    Logger.info('UsersHandler: getUsersHandler completed', {
      method: request.method,
      url: request.url,
      result: { userCount: formattedUsers.length, total: result.count }
    });

    return response;
  } catch (error) {
    Logger.error('UsersHandler: getUsersHandler failed', {
      method: request.method,
      url: request.url,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
