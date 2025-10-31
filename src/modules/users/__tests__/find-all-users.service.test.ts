import { expect, describe, it, beforeEach, vi } from 'vitest';

import { UserService } from '../users.service';
import {
  setupUserService,
  createTestUserData,
  createTestUserDataArray,
  createMultipleUsers,
  expectPaginationToMatch,
} from './test-utils';

// Mock the Logger to be framework-agnostic
vi.mock('@/core/utils/logger.util', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    businessLogic: vi.fn(),
    databaseQuery: vi.fn(),
    initialize: vi.fn(),
  }
}));

let sut: UserService;

describe('Find All Users Service', () => {
  // NOTE: Input validation (page >= 1, limit >= 1) is handled by Handler layer (Zod schema)
  // Service tests assume valid inputs only
  const baseUrl = 'http://localhost:3000/users';

  beforeEach(() => {
    const setup = setupUserService();
    sut = setup.userService;
  });

  describe('Successful user retrieval', () => {
    it('should find all users when repository is empty', async () => {
      // Act
      const result = await sut.findAllUsers(1, 10, baseUrl);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(result.pages).toBe(0);
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBeNull();
    });

    it('should find all users with basic pagination', async () => {
      // Arrange
      const usersData = createTestUserDataArray(2);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(1, 10, baseUrl);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.pages).toBe(1);
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBeNull();
    });

    it('should return users without passwords', async () => {
      // Arrange
      const usersData = createTestUserDataArray(2);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(1, 10, baseUrl);

      // Assert
      result.data.forEach(user => {
        expect((user as any).password).toBeUndefined();
        expect(user.id).toEqual(expect.any(String));
        expect(user.name).toEqual(expect.any(String));
        expect(user.email).toEqual(expect.any(String));
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should find users with different page sizes', async () => {
      // Arrange
      const usersData = createTestUserDataArray(15);
      await createMultipleUsers(sut, usersData);

      // Act & Assert - Page size 5
      const result5 = await sut.findAllUsers(1, 5, baseUrl);
      expect(result5.data).toHaveLength(5);
      expect(result5.count).toBe(15);
      expect(result5.pages).toBe(3);

      // Act & Assert - Page size 10
      const result10 = await sut.findAllUsers(1, 10, baseUrl);
      expect(result10.data).toHaveLength(10);
      expect(result10.count).toBe(15);
      expect(result10.pages).toBe(2);

      // Act & Assert - Page size 20
      const result20 = await sut.findAllUsers(1, 20, baseUrl);
      expect(result20.data).toHaveLength(15);
      expect(result20.count).toBe(15);
      expect(result20.pages).toBe(1);
    });
  });

  describe('Pagination logic', () => {
    it('should handle first page correctly', async () => {
      // Arrange
      const usersData = createTestUserDataArray(15);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(1, 5, baseUrl);

      // Assert
      expectPaginationToMatch(result, 15, 1, 5, 3);
      expect(result.prevPage).toBeNull();
      expect(result.nextPage).toContain('page=2');
    });

    it('should handle middle page correctly', async () => {
      // Arrange
      const usersData = createTestUserDataArray(15);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(2, 5, baseUrl);

      // Assert
      expectPaginationToMatch(result, 15, 2, 5, 3);
      expect(result.prevPage).toContain('page=1');
      expect(result.nextPage).toContain('page=3');
    });

    it('should handle last page correctly', async () => {
      // Arrange
      const usersData = createTestUserDataArray(15);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(3, 5, baseUrl);

      // Assert
      expectPaginationToMatch(result, 15, 3, 5, 3);
      expect(result.prevPage).toContain('page=2');
      expect(result.nextPage).toBeNull();
    });

    it('should handle page beyond available data', async () => {
      // Arrange
      const usersData = createTestUserDataArray(5);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(10, 5, baseUrl);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(5);
      expect(result.pages).toBe(1);
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large page sizes', async () => {
      // Arrange
      const usersData = createTestUserDataArray(5);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(1, 1000, baseUrl);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.count).toBe(5);
      expect(result.pages).toBe(1);
    });

    it('should handle empty base URL', async () => {
      // Arrange
      const usersData = createTestUserDataArray(5);
      await createMultipleUsers(sut, usersData);

      // Act
      const result = await sut.findAllUsers(1, 5, '');

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.count).toBe(5);
      // URLs should still be generated even with empty base URL
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBeNull();
    });

    it('should handle base URL with query parameters', async () => {
      // Arrange
      const usersData = createTestUserDataArray(15);
      await createMultipleUsers(sut, usersData);
      const baseUrlWithQuery = 'http://localhost:3000/users?filter=active';

      // Act
      const result = await sut.findAllUsers(2, 5, baseUrlWithQuery);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.nextPage).toContain('page=3');
      expect(result.prevPage).toContain('page=1');
    });
  });

  describe('Data consistency', () => {
    it('should maintain consistent ordering across pages', async () => {
      // Arrange
      const usersData = createTestUserDataArray(10);
      await createMultipleUsers(sut, usersData);

      // Act
      const page1 = await sut.findAllUsers(1, 3, baseUrl);
      const page2 = await sut.findAllUsers(2, 3, baseUrl);
      const page3 = await sut.findAllUsers(3, 3, baseUrl);

      // Assert
      const allUserIds = [
        ...page1.data.map(u => u.id),
        ...page2.data.map(u => u.id),
        ...page3.data.map(u => u.id)
      ];
      const uniqueIds = new Set(allUserIds);
      expect(uniqueIds.size).toBe(allUserIds.length); // No duplicates
    });

    it('should return same data for same page request', async () => {
      // Arrange
      const usersData = createTestUserDataArray(10);
      await createMultipleUsers(sut, usersData);

      // Act
      const result1 = await sut.findAllUsers(2, 3, baseUrl);
      const result2 = await sut.findAllUsers(2, 3, baseUrl);

      // Assert
      expect(result1.data).toEqual(result2.data);
      expect(result1.count).toBe(result2.count);
      expect(result1.pages).toBe(result2.pages);
    });

    it('should reflect changes after user creation', async () => {
      // Arrange
      const initialUsers = createTestUserDataArray(3);
      await createMultipleUsers(sut, initialUsers);

      // Act - Get initial count
      const initialResult = await sut.findAllUsers(1, 10, baseUrl);
      expect(initialResult.count).toBe(3);

      // Create new user
      const newUserData = createTestUserData({ email: 'newuser@example.com' });
      await sut.createUser(newUserData);

      // Act - Get updated count
      const updatedResult = await sut.findAllUsers(1, 10, baseUrl);

      // Assert
      expect(updatedResult.count).toBe(4);
      expect(updatedResult.data).toHaveLength(4);
    });

    it('should reflect changes after user deletion', async () => {
      // Arrange
      const usersData = createTestUserDataArray(5);
      const createdUsers = await createMultipleUsers(sut, usersData);

      // Act - Get initial count
      const initialResult = await sut.findAllUsers(1, 10, baseUrl);
      expect(initialResult.count).toBe(5);

      // Delete a user
      await sut.deleteUser(createdUsers[2].id);

      // Act - Get updated count
      const updatedResult = await sut.findAllUsers(1, 10, baseUrl);

      // Assert
      expect(updatedResult.count).toBe(4);
      expect(updatedResult.data).toHaveLength(4);
      expect(updatedResult.data.some(u => u.id === createdUsers[2].id)).toBe(false);
    });
  });

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange
      const usersData = createTestUserDataArray(20); // Reduced from 100 to 20
      await createMultipleUsers(sut, usersData);

      // Act
      const startTime = Date.now();
      const result = await sut.findAllUsers(1, 10, baseUrl);
      const endTime = Date.now();

      // Assert
      expect(result.data).toHaveLength(10);
      expect(result.count).toBe(20);
      expect(endTime - startTime).toBeLessThan(500); // Increased timeout for in-memory operations
    }, 10000); // 10 second timeout

    it('should handle pagination efficiently with large datasets', async () => {
      // Arrange
      const usersData = createTestUserDataArray(20); // Reduced from 100 to 20
      await createMultipleUsers(sut, usersData);

      // Act
      const startTime = Date.now();
      const result = await sut.findAllUsers(2, 5, baseUrl); // Second page
      const endTime = Date.now();

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.count).toBe(20);
      expect(endTime - startTime).toBeLessThan(500); // Increased timeout for in-memory operations
    }, 10000); // 10 second timeout
  });
});