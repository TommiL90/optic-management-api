import { User } from '@prisma/client';
import { CreateUser, UpdateUser, FetchUsers, UserWithoutPassword } from '../schemas/users.schemas';

/**
 * User Repository Interface
 * Defines the contract for user data access operations
 * 
 * This interface allows for multiple implementations:
 * - PrismaUsersRepository (PostgreSQL, MySQL, SQLite)
 * - MongoUsersRepository (MongoDB)
 * - MockUsersRepository (Testing)
 */
export interface IUserRepository {
  /**
   * Create a new user
   * @param data - User data
   * @returns Promise with created user without password
   */
  create(data: CreateUser): Promise<UserWithoutPassword>;

  /**
   * Find user by email (for API responses)
   * @param email - User email
   * @returns Promise with user without password or null
   */
  findByEmail(email: string): Promise<UserWithoutPassword | null>;

  /**
   * Find user by email (for authentication - includes password)
   * @param email - User email
   * @returns Promise with user or null
   */
  findByEmailForAuth(email: string): Promise<User | null>;

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise with user without password or null
   */
  findById(id: string): Promise<UserWithoutPassword | null>;

  /**
   * Get all users with pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Promise with paginated users
   */
  findAll(skip: number, take: number): Promise<FetchUsers>;

  /**
   * Update user
   * @param id - User ID
   * @param data - User data to update
   * @returns Promise with updated user without password
   */
  update(id: string, data: UpdateUser): Promise<UserWithoutPassword>;

  /**
   * Delete user
   * @param id - User ID
   * @returns Promise void
   */
  delete(id: string): Promise<void>;
}
