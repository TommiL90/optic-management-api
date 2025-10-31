import { prisma } from '@/core/database/prisma.client';
import { IUserRepository } from './users.repository.interface';
import { CreateUser, UpdateUser, FetchUsers, UserWithoutPassword } from '../schemas/users.schemas';
import { Logger } from '@/core/utils/logger.util';

/**
 * Prisma User Repository Implementation
 * Implements IUserRepository using Prisma ORM
 */
export class PrismaUserRepository implements IUserRepository {
  /**
   * Create a new user
   * @param data - User data
   * @returns Promise with created user without password
   */
  async create(data: CreateUser): Promise<UserWithoutPassword> {
    Logger.debug('PrismaUserRepository: create started', {
      operation: 'create',
      table: 'users',
      data: { email: data.email, name: data.name }
    });

    try {
      const user = await prisma.user.create({
        data,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      Logger.debug('PrismaUserRepository: create completed', {
        operation: 'create',
        table: 'users',
        userId: user.id
      });

      return user;
    } catch (error) {
      Logger.error('PrismaUserRepository: create failed', {
        operation: 'create',
        table: 'users',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Find user by email (for API responses)
   * @param email - User email
   * @returns Promise with user without password or null
   */
  async findByEmail(email: string): Promise<UserWithoutPassword | null> {
    Logger.debug('PrismaUserRepository: findByEmail started', {
      operation: 'findByEmail',
      table: 'users',
      filters: { email }
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      Logger.debug('PrismaUserRepository: findByEmail completed', {
        operation: 'findByEmail',
        table: 'users',
        found: !!user
      });

      return user;
    } catch (error) {
      Logger.error('PrismaUserRepository: findByEmail failed', {
        operation: 'findByEmail',
        table: 'users',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Find user by email (for authentication - includes password)
   * @param email - User email
   * @returns Promise with user or null
   */
  async findByEmailForAuth(email: string) {
    Logger.debug('PrismaUserRepository: findByEmailForAuth started', {
      operation: 'findByEmailForAuth',
      table: 'users',
      filters: { email }
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      Logger.debug('PrismaUserRepository: findByEmailForAuth completed', {
        operation: 'findByEmailForAuth',
        table: 'users',
        found: !!user
      });

      return user;
    } catch (error) {
      Logger.error('PrismaUserRepository: findByEmailForAuth failed', {
        operation: 'findByEmailForAuth',
        table: 'users',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise with user without password or null
   */
  async findById(id: string): Promise<UserWithoutPassword | null> {
    Logger.debug('PrismaUserRepository: findById started', {
      operation: 'findById',
      table: 'users',
      filters: { id }
    });

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      Logger.debug('PrismaUserRepository: findById completed', {
        operation: 'findById',
        table: 'users',
        found: !!user
      });

      return user;
    } catch (error) {
      Logger.error('PrismaUserRepository: findById failed', {
        operation: 'findById',
        table: 'users',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get all users with pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Promise with paginated users
   */
  async findAll(skip: number, take: number): Promise<FetchUsers> {
    Logger.debug('PrismaUserRepository: findAll started', {
      operation: 'findAll',
      table: 'users',
      pagination: { skip, take }
    });

    try {
      const usersPromise = prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalPromise = prisma.user.count();

      const [users, count] = await Promise.all([usersPromise, totalPromise]);

      Logger.debug('PrismaUserRepository: findAll completed', {
        operation: 'findAll',
        table: 'users',
        count: users.length,
        total: count
      });

      return {
        count,
        data: users,
      };
    } catch (error) {
      Logger.error('PrismaUserRepository: findAll failed', {
        operation: 'findAll',
        table: 'users',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update user
   * @param id - User ID
   * @param data - User data to update
   * @returns Promise with updated user without password
   */
  async update(id: string, data: UpdateUser): Promise<UserWithoutPassword> {
    Logger.debug('PrismaUserRepository: update started', {
      operation: 'update',
      table: 'users',
      filters: { id },
      data
    });

    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      Logger.debug('PrismaUserRepository: update completed', {
        operation: 'update',
        table: 'users',
        userId: user.id
      });

      return user;
    } catch (error) {
      Logger.error('PrismaUserRepository: update failed', {
        operation: 'update',
        table: 'users',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Delete user
   * @param id - User ID
   * @returns Promise void
   */
  async delete(id: string): Promise<void> {
    Logger.debug('PrismaUserRepository: delete started', {
      operation: 'delete',
      table: 'users',
      filters: { id }
    });

    try {
      await prisma.user.delete({
        where: { id },
      });

      Logger.debug('PrismaUserRepository: delete completed', {
        operation: 'delete',
        table: 'users',
        userId: id
      });
    } catch (error) {
      Logger.error('PrismaUserRepository: delete failed', {
        operation: 'delete',
        table: 'users',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
