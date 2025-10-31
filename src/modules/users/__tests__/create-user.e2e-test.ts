import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('Create User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Successful user creation', () => {
    it('should create user with valid data (201)', async () => {
      // Given
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body.name).toBe(userData.name);
      expect(body.email).toBe(userData.email);
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    });

    it('should not return password in response', async () => {
      // Given
      const userData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'securepass456',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('password');
    });

    it('should return dates in ISO string format', async () => {
      // Given
      const userData = {
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
        password: 'mypassword789',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(body.createdAt)).not.toThrow();
      expect(() => new Date(body.updatedAt)).not.toThrow();
    });

    it('should return location header with new user URI', async () => {
      // Given
      const userData = {
        name: 'Alice Wonder',
        email: 'alice@example.com',
        password: 'wonderland',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(response.headers.location).toBe(`/users/${body.id}`);
    });

    it('should hash password in database', async () => {
      // Given
      const userData = {
        name: 'Security Test',
        email: 'security@example.com',
        password: 'plaintextpassword',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      const userInDb = await app.prisma.user.findUnique({
        where: { id: body.id },
      });
      expect(userInDb?.password).not.toBe(userData.password);
      expect(userInDb?.password).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('Validation errors', () => {
    it('should fail with duplicate email (409)', async () => {
      // Given - Create first user
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
      };
      await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // When - Try to create second user with same email
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'different123',
        },
      });

      // Then
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.message.toLowerCase()).toContain('email');
    });

    it('should fail with invalid email format (400)', async () => {
      // Given
      const userData = {
        name: 'Invalid Email',
        email: 'not-an-email',
        password: 'password123',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('email');
    });

    it('should fail with missing required fields (400)', async () => {
      // Given
      const userData = {
        name: 'Missing Fields',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(400);
    });

    it('should fail with short password less than 6 chars (400)', async () => {
      // Given
      const userData = {
        name: 'Short Pass',
        email: 'short@example.com',
        password: '12345',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('6');
    });

    it('should fail with empty name (400)', async () => {
      // Given
      const userData = {
        name: '',
        email: 'empty@example.com',
        password: 'password123',
      };

      // When
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData,
      });

      // Then
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('Name');
    });
  });
});
