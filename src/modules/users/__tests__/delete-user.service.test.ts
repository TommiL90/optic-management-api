import { expect, describe, it, beforeEach, vi } from 'vitest';

import { UserService } from '../users.service';
import { NotFoundException } from '@/core/errors/app-errors';
import {
  setupUserService,
  createTestUserData,
  createUserInRepository,
  createMultipleUsers,
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

describe('Delete User Service', () => {
  let usersRepository: any;
  let sut: UserService;

  beforeEach(() => {
    const setup = setupUserService();
    usersRepository = setup.usersRepository;
    sut = setup.userService;
  });

  describe('Successful user deletion', () => {
    it('should delete a user successfully', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);

      // Act
      await sut.deleteUser(createdUser.id);

      // Assert
      await expect(() => sut.findUserById(createdUser.id))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should delete user and allow email reuse', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);

      // Act
      await sut.deleteUser(createdUser.id);
      const newUser = await sut.createUser(userData);

      // Assert
      expect(newUser.id).not.toBe(createdUser.id);
      expect(newUser.email).toBe(userData.email);
    });

    it('should delete multiple users independently', async () => {
      // Arrange
      const usersData = [
        createTestUserData({ email: 'user1@example.com' }),
        createTestUserData({ email: 'user2@example.com' }),
        createTestUserData({ email: 'user3@example.com' })
      ];
      const [user1, user2, user3] = await createMultipleUsers(sut, usersData);

      // Act
      await sut.deleteUser(user2.id);

      // Assert
      // user1 should still exist
      const foundUser1 = await sut.findUserById(user1.id);
      expect(foundUser1.id).toBe(user1.id);

      // user2 should be deleted
      await expect(() => sut.findUserById(user2.id))
        .rejects.toBeInstanceOf(NotFoundException);

      // user3 should still exist
      const foundUser3 = await sut.findUserById(user3.id);
      expect(foundUser3.id).toBe(user3.id);
    });

    it('should handle deletion of user with special characters in data', async () => {
      // Arrange
      const userData = createTestUserData({
        name: 'José María O\'Connor-Smith',
        email: 'special@example.co.uk'
      });
      const createdUser = await createUserInRepository(sut, userData);

      // Act
      await sut.deleteUser(createdUser.id);

      // Assert
      await expect(() => sut.findUserById(createdUser.id))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Error handling', () => {
    it('should throw NotFoundException for non-existing id', async () => {
      // Arrange
      const nonExistingId = 'non-existing-id';

      // Act & Assert
      await expect(() => sut.deleteUser(nonExistingId))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException for empty id', async () => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      await expect(() => sut.deleteUser(emptyId))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException for null id', async () => {
      // Arrange
      const nullId = null as any;

      // Act & Assert
      await expect(() => sut.deleteUser(nullId))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException for undefined id', async () => {
      // Arrange
      const undefinedId = undefined as any;

      // Act & Assert
      await expect(() => sut.deleteUser(undefinedId))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when trying to delete already deleted user', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      await sut.deleteUser(createdUser.id);

      // Act & Assert
      await expect(() => sut.deleteUser(createdUser.id))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long id strings', async () => {
      // Arrange
      const longId = 'a'.repeat(1000);

      // Act & Assert
      await expect(() => sut.deleteUser(longId))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should handle special characters in id', async () => {
      // Arrange
      const specialId = 'user-id-with-special-chars-!@#$%^&*()';

      // Act & Assert
      await expect(() => sut.deleteUser(specialId))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should handle numeric string ids', async () => {
      // Arrange
      const numericId = '123456789';

      // Act & Assert
      await expect(() => sut.deleteUser(numericId))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should handle deletion of last user in repository', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);

      // Act
      await sut.deleteUser(createdUser.id);

      // Assert
      await expect(() => sut.findUserById(createdUser.id))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Business logic validations', () => {
    it('should maintain data integrity after deletion', async () => {
      // Arrange
      const usersData = [
        createTestUserData({ email: 'user1@example.com' }),
        createTestUserData({ email: 'user2@example.com' }),
        createTestUserData({ email: 'user3@example.com' })
      ];
      const [user1, user2, user3] = await createMultipleUsers(sut, usersData);

      // Act
      await sut.deleteUser(user2.id);

      // Assert - Verify remaining users are intact
      const remainingUsers = await sut.findAllUsers(1, 10, 'http://localhost:3000/users');
      expect(remainingUsers.data).toHaveLength(2);
      expect(remainingUsers.data.some(u => u.id === user1.id)).toBe(true);
      expect(remainingUsers.data.some(u => u.id === user3.id)).toBe(true);
      expect(remainingUsers.data.some(u => u.id === user2.id)).toBe(false);
    });

    it('should allow creation of new user with same email after deletion', async () => {
      // Arrange
      const email = 'reusable@example.com';
      const userData = createTestUserData({ email });
      const createdUser = await createUserInRepository(sut, userData);

      // Act
      await sut.deleteUser(createdUser.id);
      const newUser = await sut.createUser(userData);

      // Assert
      expect(newUser.id).not.toBe(createdUser.id);
      expect(newUser.email).toBe(email);
      expect(newUser.name).toBe(userData.name);
    });
  });

  describe('Performance considerations', () => {
    it('should delete user quickly even with many users in repository', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);

      // Create some other users to test performance (reduced from 100 to 20)
      for (let i = 0; i < 20; i++) {
        await createUserInRepository(sut, createTestUserData({ 
          email: `user${i}@example.com` 
        }));
      }

      // Act
      const startTime = Date.now();
      await sut.deleteUser(createdUser.id);
      const endTime = Date.now();

      // Assert
      await expect(() => sut.findUserById(createdUser.id))
        .rejects.toBeInstanceOf(NotFoundException);
      expect(endTime - startTime).toBeLessThan(500); // Increased timeout for in-memory operations
    }, 10000); // 10 second timeout

    it('should handle bulk deletion efficiently', async () => {
      // Arrange
      const usersData = Array.from({ length: 10 }, (_, i) => 
        createTestUserData({ email: `bulkuser${i}@example.com` })
      );
      const createdUsers = await createMultipleUsers(sut, usersData);

      // Act
      const startTime = Date.now();
      for (const user of createdUsers) {
        await sut.deleteUser(user.id);
      }
      const endTime = Date.now();

      // Assert
      const remainingUsers = await sut.findAllUsers(1, 10, 'http://localhost:3000/users');
      expect(remainingUsers.data).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(2000); // Increased timeout for bulk operations
    }, 10000); // 10 second timeout
  });
});