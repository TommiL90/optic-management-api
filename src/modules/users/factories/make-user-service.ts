import { PrismaUserRepository } from '../repositories/prisma.users.repository';
import { UserService } from '../users.service';

/**
 * Factory function to create UserService with its dependencies
 *
 * This factory encapsulates the creation of UserService and its dependencies,
 * making it easier to test and maintain. It follows the Factory Function pattern
 * which provides better testability and loose coupling.
 *
 * @returns UserService instance configured with PrismaUserRepository
 *
 * @example
 * ```typescript
 * // In handler
 * const userService = makeUserService();
 * const users = await userService.findAllUsers(1, 10, baseUrl);
 * ```
 *
 * @example
 * ```typescript
 * // In tests - easy to mock
 * vi.spyOn(makeUserServiceModule, 'makeUserService').mockReturnValue(mockService);
 * ```
 */
export function makeUserService(): UserService {
  const usersRepository = new PrismaUserRepository();
  const userService = new UserService(usersRepository);
  return userService;
}
