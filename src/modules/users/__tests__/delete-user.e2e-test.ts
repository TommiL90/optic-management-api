import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('Delete User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Successful user deletion', () => {
    it('should delete existing user (204)', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'To Delete',
          email: 'todelete@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/users/${createdUser.id}`,
      });

      // Then
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });

    it('should not return body (204 status)', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/users/${createdUser.id}`,
      });

      // Then
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });

    it('should confirm deletion (subsequent GET returns 404)', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'To Be Deleted',
          email: 'tobedeleted@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When - Delete user
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/users/${createdUser.id}`,
      });
      expect(deleteResponse.statusCode).toBe(204);

      // Then - Try to get deleted user
      const getResponse = await app.inject({
        method: 'GET',
        url: `/users/${createdUser.id}`,
      });
      expect(getResponse.statusCode).toBe(404);
    });

    it('should actually remove from database', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Database Test',
          email: 'dbtest@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/users/${createdUser.id}`,
      });
      expect(response.statusCode).toBe(204);

      // Then
      const userInDb = await app.prisma.user.findUnique({
        where: { id: createdUser.id },
      });
      expect(userInDb).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return 404 with non-existent ID', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/users/${nonExistentId}`,
      });

      // Then
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.message.toLowerCase()).toContain('not found');
    });

    it('should return 400 with invalid UUID format', async () => {
      // Given
      const invalidId = 'not-a-uuid';

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/users/${invalidId}`,
      });

      // Then
      expect(response.statusCode).toBe(400);
    });
  });
});
