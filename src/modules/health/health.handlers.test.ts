import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { getHealthHandler } from './health.handlers.ts';

describe('Health Handlers', () => {
  describe('getHealthHandler', () => {
    // Arrange
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
      mockRequest = {
        log: {
          info: vi.fn(),
        } as any,
      };
      mockReply = {};
    });

    it('should return health status with correct structure', async () => {
      // Act
      const actualResult = await getHealthHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(actualResult).toHaveProperty('status');
      expect(actualResult).toHaveProperty('timestamp');
      expect(actualResult).toHaveProperty('uptime');
      expect(actualResult).toHaveProperty('version');
      expect(actualResult).toHaveProperty('environment');
    });

    it('should return status "ok"', async () => {
      // Act
      const actualResult = await getHealthHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(actualResult.status).toBe('ok');
    });

    it('should return valid ISO timestamp', async () => {
      // Act
      const actualResult = await getHealthHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(actualResult.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(actualResult.timestamp)).not.toThrow();
    });

    it('should return uptime as a number greater than 0', async () => {
      // Act
      const actualResult = await getHealthHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(typeof actualResult.uptime).toBe('number');
      expect(actualResult.uptime).toBeGreaterThan(0);
    });

    it('should log health check request and completion', async () => {
      // Act
      await getHealthHandler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(mockRequest.log?.info).toHaveBeenCalledWith('Health check requested');
      expect(mockRequest.log?.info).toHaveBeenCalledWith(
        expect.objectContaining({
          healthData: expect.any(Object),
        }),
        'Health check completed'
      );
    });
  });
});
