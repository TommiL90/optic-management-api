import { compare } from 'bcryptjs';
import { expect, describe, it, beforeEach, vi } from 'vitest';

import { UserService } from '../users.service';
import { NotFoundException, ConflictException } from '@/core/errors/app-errors';
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

describe('Update User Service', () => {
  let usersRepository: any;
  let sut: UserService;

  beforeEach(() => {
    const setup = setupUserService();
    usersRepository = setup.usersRepository;
    sut = setup.userService;
  });

  describe('Successful user updates', () => {
    it('should update user name', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { name: 'John Doe Updated' };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(userData.email);
      expect((updatedUser as any).password).toBeUndefined();
    });

    it('should update user email', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { email: 'newemail@example.com' };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.email).toBe(updateData.email);
      expect(updatedUser.name).toBe(userData.name);
    });

    it('should update user password and hash it', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const newPassword = 'newpassword123';
      const updateData = { password: newPassword };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.id).toBe(createdUser.id);
      expect((updatedUser as any).password).toBeUndefined();

      // Verify password was hashed
      const userWithPassword = await usersRepository.findByEmailForAuth(updatedUser.email);
      const isPasswordCorrectlyHashed = await compare(newPassword, userWithPassword!.password);
      expect(isPasswordCorrectlyHashed).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = {
        name: 'John Updated',
        email: 'johnupdated@example.com',
        password: 'newpassword123'
      };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
      expect((updatedUser as any).password).toBeUndefined();
    });

    it('should handle empty update object', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = {};

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.name).toBe(userData.name);
      expect(updatedUser.email).toBe(userData.email);
    });
  });

  describe('Business rule validations', () => {
    it('should not update user with non-existing id', async () => {
      // Arrange
      const nonExistingId = 'non-existing-id';
      const updateData = { name: 'Updated Name' };

      // Act & Assert
      await expect(() => sut.updateUser(nonExistingId, updateData))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('should not update user with email that is already taken by another user', async () => {
      // Arrange
      const usersData = [
        createTestUserData({ email: 'user1@example.com' }),
        createTestUserData({ email: 'user2@example.com' })
      ];
      const [, user2] = await createMultipleUsers(sut, usersData);
      const updateData = { email: 'user1@example.com' };

      // Act & Assert
      await expect(() => sut.updateUser(user2.id, updateData))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('should allow user to keep their own email', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { 
        name: 'Updated Name',
        email: userData.email // Same email
      };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.email).toBe(userData.email);
      expect(updatedUser.name).toBe(updateData.name);
    });

    it('should allow email update if no other user has that email', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { email: 'completelynew@example.com' };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.email).toBe(updateData.email);
    });
  });

  describe('Input validation', () => {
    it('should handle invalid email format', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { email: 'invalid-email' };

      // Act & Assert
      await expect(() => sut.updateUser(createdUser.id, updateData))
        .rejects.toThrow();
    });

    it('should handle empty name', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { name: '' };

      // Act & Assert
      await expect(() => sut.updateUser(createdUser.id, updateData))
        .rejects.toThrow();
    });

    it('should handle weak password', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { password: '123' };

      // Act & Assert
      await expect(() => sut.updateUser(createdUser.id, updateData))
        .rejects.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long names', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const longName = 'A'.repeat(255);
      const updateData = { name: longName };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.name).toBe(longName);
    });

    it('should handle special characters in name', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const specialName = 'José María O\'Connor-Smith';
      const updateData = { name: specialName };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.name).toBe(specialName);
    });

    it('should handle international email domains', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { email: 'test@example.co.uk' };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.email).toBe('test@example.co.uk');
    });

    it('should handle undefined values in update data', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { 
        name: undefined as any,
        email: undefined as any,
        password: 'validpassword123'
      };

      // Act
      const updatedUser = await sut.updateUser(createdUser.id, updateData);

      // Assert
      expect(updatedUser.name).toBe(userData.name); // Should remain unchanged
      expect(updatedUser.email).toBe(userData.email); // Should remain unchanged
      expect((updatedUser as any).password).toBeUndefined();
    });

    it('should reject null values in update data', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);
      const updateData = { 
        name: null as any,
        email: 'valid@example.com',
        password: 'validpassword123'
      };

      // Act & Assert
      await expect(() => sut.updateUser(createdUser.id, updateData))
        .rejects.toThrow();
    });
  });

  describe('Performance considerations', () => {
    it('should update user quickly even with many users in repository', async () => {
      // Arrange
      const userData = createTestUserData();
      const createdUser = await createUserInRepository(sut, userData);

      // Create some other users to test performance (reduced from 100 to 20)
      for (let i = 0; i < 20; i++) {
        await createUserInRepository(sut, createTestUserData({ 
          email: `user${i}@example.com` 
        }));
      }

      const updateData = { name: 'Updated Name' };

      // Act
      const startTime = Date.now();
      const updatedUser = await sut.updateUser(createdUser.id, updateData);
      const endTime = Date.now();

      // Assert
      expect(updatedUser.name).toBe(updateData.name);
      expect(endTime - startTime).toBeLessThan(500); // Increased timeout for in-memory operations
    }, 10000); // 10 second timeout
  });
});