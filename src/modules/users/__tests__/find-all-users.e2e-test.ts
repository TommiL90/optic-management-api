import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('Find All Users (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Successful user retrieval', () => {
    it('should get all users with default pagination (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('users');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.users)).toBe(true);
      
      // Verificar estructura de paginación
      expect(body.pagination).toHaveProperty('page');
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('total');
      expect(body.pagination).toHaveProperty('pages');
      expect(body.pagination).toHaveProperty('hasNext');
      expect(body.pagination).toHaveProperty('hasPrev');
      expect(body.pagination).toHaveProperty('nextPage');
      expect(body.pagination).toHaveProperty('prevPage');
      
      // Valores por defecto
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(10);
    });

    it('should get users with custom pagination (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=5',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(5);
      expect(body.users.length).toBeLessThanOrEqual(5);
    });

    it('should return users without password field (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      if (body.users.length > 0) {
        const user = body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  describe('Pagination logic', () => {
    it('should handle first page correctly (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=3',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.hasPrev).toBe(false);
      expect(body.pagination.prevPage).toBeNull();
    });

    it('should handle middle page correctly (200)', async () => {
      // Given - Create enough users to have multiple pages
      const users = [];
      for (let i = 0; i < 10; i++) {
        users.push(await app.inject({
          method: 'POST',
          url: '/users',
          payload: {
            name: `User ${i}`,
            email: `user${i}@example.com`,
            password: 'password123',
          },
        }));
      }

      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=2&limit=3',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.pagination.page).toBe(2);
      expect(body.pagination.hasPrev).toBe(true);
      expect(body.pagination.prevPage).toContain('page=1');
    });

    it('should handle last page correctly (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=999&limit=10',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.pagination.page).toBe(999);
      expect(body.pagination.hasNext).toBe(false);
      expect(body.pagination.nextPage).toBeNull();
    });

    it('should handle page beyond available data (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=9999&limit=10',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.users).toEqual([]);
      expect(body.pagination.page).toBe(9999);
      expect(body.pagination.hasNext).toBe(false);
      expect(body.pagination.nextPage).toBeNull();
      expect(body.pagination.prevPage).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle page 0 gracefully (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=0&limit=10',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      // Debería normalizar a página 1
      expect(body.pagination.page).toBe(1);
    });

    it('should handle negative page gracefully (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=-1&limit=10',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      // Debería normalizar a página 1
      expect(body.pagination.page).toBe(1);
    });

    it('should handle very large page sizes (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=1000',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Zod .max(100) rejects values > 100, falls back to default 10
      expect(body.pagination.limit).toBe(10);
    });

    it('should handle page size of 0 gracefully (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=0',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Zod .min(1).default(10) normalizes to default when invalid
      expect(body.pagination.limit).toBe(10);
    });

    it('should handle negative page size gracefully (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=-5',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Zod .min(1).default(10) normalizes to default when invalid
      expect(body.pagination.limit).toBe(10);
    });
  });

  describe('URL generation', () => {
    it('should generate correct next and prev page URLs (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=2&limit=5',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      if (body.pagination.hasNext) {
        expect(body.pagination.nextPage).toContain('page=3');
        expect(body.pagination.nextPage).toContain('limit=5');
      }
      
      if (body.pagination.hasPrev) {
        expect(body.pagination.prevPage).toContain('page=1');
        expect(body.pagination.prevPage).toContain('limit=5');
      }
    });

    it('should handle base URL with query parameters (200)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=5&sort=name',
      });

      // Then
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(5);
    });
  });

  describe('Data consistency', () => {
    it('should maintain consistent ordering across pages (200)', async () => {
      // When
      const page1Response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=3',
      });
      
      const page2Response = await app.inject({
        method: 'GET',
        url: '/users?page=2&limit=3',
      });

      // Then
      expect(page1Response.statusCode).toBe(200);
      expect(page2Response.statusCode).toBe(200);
      
      const page1Body = JSON.parse(page1Response.body);
      const page2Body = JSON.parse(page2Response.body);
      
      // Verificar que no hay duplicados entre páginas
      const page1Ids = page1Body.users.map((user: any) => user.id);
      const page2Ids = page2Body.users.map((user: any) => user.id);
      
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection).toEqual([]);
    });

    it('should return same data for same page request (200)', async () => {
      // When
      const response1 = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=5',
      });
      
      const response2 = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=5',
      });

      // Then
      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
      
      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);
      
      expect(body1.users).toEqual(body2.users);
      expect(body1.pagination).toEqual(body2.pagination);
    });
  });

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently (200)', async () => {
      // When
      const startTime = Date.now();
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=1&limit=100',
      });
      const endTime = Date.now();

      // Then
      expect(response.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // 5 segundos máximo
      
      const body = JSON.parse(response.body);
      expect(body.users.length).toBeLessThanOrEqual(100);
    }, 10000); // 10 segundos timeout

    it('should handle pagination efficiently with large datasets (200)', async () => {
      // When
      const startTime = Date.now();
      const response = await app.inject({
        method: 'GET',
        url: '/users?page=10&limit=50',
      });
      const endTime = Date.now();

      // Then
      expect(response.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000); // 3 segundos máximo
    }, 10000); // 10 segundos timeout
  });
});
