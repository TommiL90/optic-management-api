import { HttpException } from './http-exception';

/**
 * BadRequestException - 400 Bad Request
 *
 * Thrown when the request is malformed or contains invalid data.
 *
 * @example
 * ```typescript
 * throw new BadRequestException('Invalid input data', { field: 'email' });
 * ```
 */
export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

/**
 * UnauthorizedException - 401 Unauthorized
 *
 * Thrown when authentication is required but not provided or is invalid.
 *
 * @example
 * ```typescript
 * throw new UnauthorizedException('Invalid credentials');
 * ```
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

/**
 * ForbiddenException - 403 Forbidden
 *
 * Thrown when the user is authenticated but doesn't have permission to access the resource.
 *
 * @example
 * ```typescript
 * throw new ForbiddenException('Insufficient permissions');
 * ```
 */
export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(403, 'FORBIDDEN', message, details);
  }
}

/**
 * NotFoundException - 404 Not Found
 *
 * Thrown when a requested resource cannot be found.
 *
 * @example
 * ```typescript
 * throw new NotFoundException('User', '123');
 * throw new NotFoundException('User', { email: 'test@example.com' });
 * ```
 */
export class NotFoundException extends HttpException {
  constructor(resource: string, identifier?: string | Record<string, unknown>) {
    let message: string;
    let details: unknown;

    if (typeof identifier === 'string') {
      message = `${resource} with id ${identifier} not found`;
      details = identifier;
    } else if (identifier && typeof identifier === 'object') {
      const entries = Object.entries(identifier);
      const identifierStr = entries.map(([key, value]) => `${key} ${value}`).join(', ');
      message = `${resource} with ${identifierStr} not found`;
      details = identifier;
    } else {
      message = `${resource} not found`;
      details = undefined;
    }

    super(404, 'NOT_FOUND', message, details);
  }
}

/**
 * ConflictException - 409 Conflict
 *
 * Thrown when there's a conflict with the current state of the resource
 * (e.g., duplicate email, unique constraint violation).
 *
 * @example
 * ```typescript
 * throw new ConflictException('Email already exists', { email: 'user@example.com' });
 * ```
 */
export class ConflictException extends HttpException {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

/**
 * UnprocessableEntityException - 422 Unprocessable Entity
 *
 * Thrown when the request is well-formed but contains semantic errors.
 *
 * @example
 * ```typescript
 * throw new UnprocessableEntityException('Cannot process order', { reason: 'Out of stock' });
 * ```
 */
export class UnprocessableEntityException extends HttpException {
  constructor(message: string = 'Unprocessable Entity', details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details);
  }
}

/**
 * InternalServerErrorException - 500 Internal Server Error
 *
 * Thrown when an unexpected error occurs on the server.
 *
 * @example
 * ```typescript
 * throw new InternalServerErrorException('Database connection failed');
 * ```
 */
export class InternalServerErrorException extends HttpException {
  constructor(message: string = 'Internal Server Error', details?: unknown) {
    super(500, 'INTERNAL_SERVER_ERROR', message, details);
  }
}

/**
 * ValidationException - 400 Bad Request (Zod Validation)
 *
 * Specific exception for Zod validation errors.
 *
 * @example
 * ```typescript
 * throw new ValidationException('Validation failed', zodError.issues);
 * ```
 */
export class ValidationException extends HttpException {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

/**
 * DatabaseException - 500 Internal Server Error (Database Errors)
 *
 * Specific exception for database-related errors (Prisma, connection issues, etc.).
 *
 * @example
 * ```typescript
 * throw new DatabaseException('Failed to create user', prismaError);
 * ```
 */
export class DatabaseException extends HttpException {
  constructor(message: string = 'Database error', details?: unknown) {
    super(500, 'DATABASE_ERROR', message, details);
  }
}

/**
 * PrescriptionRangeNotFoundException - 404 Not Found
 *
 * Thrown when no prescription range is found to cover the given prescription values.
 *
 * @example
 * ```typescript
 * throw new PrescriptionRangeNotFoundException({ od: { sphere: 8, cylinder: -6 }, oi: { sphere: 7, cylinder: -5 } });
 * ```
 */
export class PrescriptionRangeNotFoundException extends HttpException {
  constructor(prescription?: unknown) {
    const message = 'No se encontró una tabla de precios que cubra esta prescripción';
    super(404, 'PRESCRIPTION_RANGE_NOT_FOUND', message, prescription);
  }
}
