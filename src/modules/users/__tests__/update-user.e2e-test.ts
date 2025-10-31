import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('Update User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Successful user update', () => {
    it('should update only user name (200)', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Original Name',
          email: 'original@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${createdUser.id}`,
        payload: {
          name: 'Updated Name',
        },
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated Name');
      expect(body.email).toBe('original@example.com');
    });

    it('should update only user email (200)', async () => {
      // Given
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
        method: 'PATCH',
        url: `/users/${createdUser.id}`,
        payload: {
          email: 'newemail@example.com',
        },
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.email).toBe('newemail@example.com');
      expect(body.name).toBe('John Doe');
    });

    it('should update only user password (200)', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'oldpass123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${createdUser.id}`,
        payload: {
          password: 'newpass456',
        },
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('password');
      const userInDb = await app.prisma.user.findUnique({
        where: { id: createdUser.id },
      });
      expect(userInDb?.password).not.toBe('newpass456');
      expect(userInDb?.password).toHaveLength(60);
    });

    it('should update multiple fields at once (200)', async () => {
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
        method: 'PATCH',
        url: `/users/${createdUser.id}`,
        payload: {
          name: 'Robert Smith',
          email: 'robert@example.com',
        },
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Robert Smith');
      expect(body.email).toBe('robert@example.com');
    });

    it('should not return password in response', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Alice Wonder',
          email: 'alice@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${createdUser.id}`,
        payload: {
          name: 'Alice Wonderland',
        },
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('password');
    });

    it('should not modify fields not in request body', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${createdUser.id}`,
        payload: {
          name: 'Updated Test User',
        },
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.email).toBe('test@example.com');
    });
  });

  describe('Error handling', () => {
    it('should return 404 with non-existent ID', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${nonExistentId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      // Then
      expect(response.statusCode).toBe(404);
    });

    it('should return 409 with duplicate email', async () => {
      // Given - Create two users
      await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'User One',
          email: 'userone@example.com',
          password: 'password123',
        },
      });

      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'User Two',
          email: 'usertwo@example.com',
          password: 'password123',
        },
      });
      const userTwo = JSON.parse(createResponse.body);

      // When - Try to update user two with user one's email
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${userTwo.id}`,
        payload: {
          email: 'userone@example.com',
        },
      });

      // Then
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.message.toLowerCase()).toContain('email');
    });

    it('should return 400 with invalid email format', async () => {
      // Given
      const createResponse = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Valid User',
          email: 'valid@example.com',
          password: 'password123',
        },
      });
      const createdUser = JSON.parse(createResponse.body);

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${createdUser.id}`,
        payload: {
          email: 'not-an-email',
        },
      });

      // Then
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 with invalid UUID in params', async () => {
      // Given
      const invalidId = 'not-a-uuid';

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/users/${invalidId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      // Then
      expect(response.statusCode).toBe(400);
    });
  });
});
