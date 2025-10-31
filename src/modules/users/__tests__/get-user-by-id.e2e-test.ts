import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('Get User By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Successful user retrieval', () => {
    it('should get user by valid ID (200)', async () => {
      // Given - Create a user first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/users/${createdUser.id}`,
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(createdUser.id);
      expect(body.name).toBe('John Doe');
      expect(body.email).toBe('john@example.com');
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    });

    it('should not return password', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'secret123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/users/${createdUser.id}`,
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('password');
    });

    it('should return dates in ISO format', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Bob Smith',
          email: 'bob@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/users/${createdUser.id}`,
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return correct user data structure', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Alice Wonder',
          email: 'alice@example.com',
          password: 'wonderland',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/users/${createdUser.id}`,
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('Error handling', () => {
    it('should return 404 with non-existent ID', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/users/${nonExistentId}`,
      });

      // Then
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.message.toLowerCase()).toContain('not found');
    });

    it('should return 400 with invalid UUID format', async () => {
      // Given
      const invalidId = 'not-a-valid-uuid';

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/users/${invalidId}`,
      });

      // Then
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 with empty ID', async () => {
      // Given - empty string as ID

      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users/ ',
      });

      // Then
      expect(response.statusCode).toBe(400); // Invalid UUID format
    });
  });
});
