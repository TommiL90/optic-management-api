import { IUserRepository } from './repositories/users.repository.interface';
import { CreateUser, UpdateUser, UserWithoutPassword, PaginatedUsers, createUserSchema, updateUserSchema } from './schemas/users.schemas';
import { Logger } from '@/core/utils/logger.util';
import { ConflictException, NotFoundException } from '@/core/errors/app-errors';
import { hash } from 'bcryptjs';

/**
 * User Service
 * Handles all user-related business logic
 */
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Hash password using bcrypt
   * @param password - Plain text password
   * @returns Promise with hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    Logger.businessLogic('UserService: hashPassword started', {
      operation: 'hashPassword'
    });

    try {
      const hashedPassword = await hash(password, 10);
      
      Logger.businessLogic('UserService: hashPassword completed', {
        operation: 'hashPassword'
      });

      return hashedPassword;
    } catch (error) {
      Logger.error('UserService: hashPassword failed', {
        operation: 'hashPassword',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Create a new user with business logic
   * @param payload - User data
   * @returns Promise with created user without password
   */
  async createUser(payload: CreateUser): Promise<UserWithoutPassword> {
    Logger.businessLogic('UserService: createUser started', {
      operation: 'createUser',
      input: { email: payload.email, name: payload.name }
    });

    try {
      // Validate input data using Zod schema
      const validatedData = createUserSchema.parse(payload);

      // Business logic: Check if email already exists
      const existingUser = await this.userRepository.findByEmail(validatedData.email);
      if (existingUser) {
        throw new ConflictException('Email already exists', {
          email: validatedData.email,
          field: 'email',
        });
      }

      // Business logic: Hash password
      const hashedPassword = await this.hashPassword(validatedData.password);

      // Create user with hashed password
      const user = await this.userRepository.create({
        ...validatedData,
        password: hashedPassword,
      });

      Logger.businessLogic('UserService: createUser completed', {
        operation: 'createUser',
        result: { userId: user.id, email: user.email }
      });

      return user;
    } catch (error) {
      Logger.error('UserService: createUser failed', {
        operation: 'createUser',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Find user by ID with business logic
   * @param id - User ID
   * @returns Promise with user without password
   */
  async findUserById(id: string): Promise<UserWithoutPassword> {
    Logger.businessLogic('UserService: findUserById started', {
      operation: 'findUserById',
      input: { id }
    });

    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User', id);
      }

      Logger.businessLogic('UserService: findUserById completed', {
        operation: 'findUserById',
        result: { userId: user.id, email: user.email }
      });

      return user;
    } catch (error) {
      Logger.error('UserService: findUserById failed', {
        operation: 'findUserById',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get all users with pagination
   * NOTE: Expects validated inputs (page >= 1, take >= 1) from Handler layer
   * @param page - Page number (must be >= 1)
   * @param take - Number of items per page (must be >= 1)
   * @param baseUrl - Base URL for pagination links
   * @returns Promise with paginated users
   */
  async findAllUsers(page: number, take: number, baseUrl: string): Promise<PaginatedUsers> {
    Logger.businessLogic('UserService: findAllUsers started', {
      operation: 'findAllUsers',
      input: { page, take }
    });

    try {
      const skip = (page - 1) * take;
      const { data, count } = await this.userRepository.findAll(skip, take);

      const pages = Math.ceil(count / take);
      const prevPage = (page === 1 || page > pages) ? null : `${baseUrl}?page=${page - 1}&limit=${take}`;
      const nextPage = page + 1 > pages ? null : `${baseUrl}?page=${page + 1}&limit=${take}`;

      const result: PaginatedUsers = {
        nextPage,
        prevPage,
        count,
        pages,
        data,
      };

      Logger.businessLogic('UserService: findAllUsers completed', {
        operation: 'findAllUsers',
        result: { count, pages, currentPage: page }
      });

      return result;
    } catch (error) {
      Logger.error('UserService: findAllUsers failed', {
        operation: 'findAllUsers',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update user with business logic
   * @param id - User ID
   * @param updateUserDto - User data to update
   * @returns Promise with updated user without password
   */
  async updateUser(id: string, updateUserDto: UpdateUser): Promise<UserWithoutPassword> {
    Logger.businessLogic('UserService: updateUser started', {
      operation: 'updateUser',
      input: { id, data: updateUserDto }
    });

    try {
      // Validate input data using Zod schema
      const validatedData = updateUserSchema.parse(updateUserDto);

      // Business logic: Check if user exists
      await this.findUserById(id);

      // Business logic: If updating email, check if it's already taken
      if (validatedData.email) {
        const existingUser = await this.userRepository.findByEmail(validatedData.email);
        if (existingUser && existingUser.id !== id) {
          throw new ConflictException('Email already taken', {
            email: validatedData.email,
            field: 'email',
          });
        }
      }

      // Business logic: Hash password if provided and filter out undefined values
      let updateData: any = {};
      if (validatedData.name !== undefined) updateData.name = validatedData.name;
      if (validatedData.email !== undefined) updateData.email = validatedData.email;
      if (validatedData.password !== undefined) {
        updateData.password = await this.hashPassword(validatedData.password);
      }

      const updatedUser = await this.userRepository.update(id, updateData);

      Logger.businessLogic('UserService: updateUser completed', {
        operation: 'updateUser',
        result: { userId: updatedUser.id, email: updatedUser.email }
      });

      return updatedUser;
    } catch (error) {
      Logger.error('UserService: updateUser failed', {
        operation: 'updateUser',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Delete user with business logic
   * @param id - User ID
   * @returns Promise void
   */
  async deleteUser(id: string): Promise<void> {
    Logger.businessLogic('UserService: deleteUser started', {
      operation: 'deleteUser',
      input: { id }
    });

    try {
      // Business logic: Check if user exists
      await this.findUserById(id);

      // Business logic: Check if user can be deleted (e.g., has no orders, etc.)
      // const canDelete = await this.checkIfUserCanBeDeleted(id);
      // if (!canDelete) {
      //   throw new Error('User cannot be deleted');
      // }

      await this.userRepository.delete(id);

      Logger.businessLogic('UserService: deleteUser completed', {
        operation: 'deleteUser',
        result: { userId: id }
      });
    } catch (error) {
      Logger.error('UserService: deleteUser failed', {
        operation: 'deleteUser',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
