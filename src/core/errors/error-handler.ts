import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpException } from './http-exception';

/**
 * Creates a global error handler for Fastify
 *
 * This handler processes different types of errors and returns consistent
 * HTTP responses with proper status codes, error codes, and details.
 *
 * Supported error types:
 * - HttpException (custom application errors)
 * - ZodError (validation errors)
 * - Prisma errors (database errors)
 * - FastifyError (framework errors)
 * - Generic Error (unexpected errors)
 *
 * @returns Fastify error handler function
 */
export function createErrorHandler() {
  return function errorHandler(
    error: FastifyError | HttpException | ZodError | Error,
    request: FastifyRequest,
    reply: FastifyReply
  ): void {
    const timestamp = new Date().toISOString();
    const path = request.url;
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal Server Error';
    let details: unknown;

    // Handle custom HttpException errors
    if (error instanceof HttpException) {
      statusCode = error.statusCode;
      code = error.code;
      message = error.message;
      details = error.details;
    }
    // Handle Zod validation errors
    else if (error instanceof ZodError) {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Validation failed';
      details = {
        issues: error.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          message: issue.message,
          code: issue.code,
          ...((issue as any).received !== undefined ? { received: (issue as any).received } : {}),
          ...((issue as any).expected !== undefined ? { expected: (issue as any).expected } : {}),
        })),
      };
    }
    // Handle Prisma errors
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      statusCode = prismaError.statusCode;
      code = prismaError.code;
      message = prismaError.message;
      details = prismaError.details;
    }
    // Handle Prisma validation errors
    else if (error instanceof Prisma.PrismaClientValidationError) {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Invalid data provided to database';
      details = { originalError: error.message };
    }
    // Handle Fastify errors
    else if ('statusCode' in error && error.statusCode) {
      statusCode = error.statusCode;
      code = error.code || 'HTTP_ERROR';
      message = error.message;
    }
    // Handle generic errors
    else {
      // In production, don't expose internal error details
      message = process.env.NODE_ENV === 'development'
        ? error.message
        : 'An unexpected error occurred';

      if (process.env.NODE_ENV === 'development') {
        details = {
          name: error.name,
          message: error.message,
        };
      }
    }

    // Log based on severity
    if (statusCode >= 500) {
      request.log.error(
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          statusCode,
          code,
          path,
        },
        'Server error occurred'
      );
    } else if (statusCode >= 400) {
      request.log.warn(
        {
          statusCode,
          code,
          message,
          path,
        },
        'Client error occurred'
      );
    }

    // Send error response
    reply.status(statusCode).send({
      error: {
        statusCode,
        code,
        message,
        timestamp,
        path,
        ...(details ? { details } : {}),
        ...(process.env.NODE_ENV === 'development' && error.stack
          ? { stack: error.stack.split('\n').slice(0, 10) }
          : {}),
      },
    });
  };
}

/**
 * Handles Prisma-specific errors and converts them to appropriate HttpExceptions
 *
 * Common Prisma error codes:
 * - P2002: Unique constraint violation
 * - P2025: Record not found
 * - P2003: Foreign key constraint violation
 * - P2014: Relation violation
 *
 * @param error - Prisma error object
 * @returns HttpException with appropriate status and message
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
} {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const fields = target ? target.join(', ') : 'field';
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: `A record with this ${fields} already exists`,
        details: {
          fields: target,
          constraint: 'unique',
        },
      };
    }

    case 'P2025': {
      // Record not found
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Record not found',
        details: {
          cause: error.meta?.cause,
        },
      };
    }

    case 'P2003': {
      // Foreign key constraint violation
      const fieldName = error.meta?.field_name as string | undefined;
      return {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: `Invalid reference: ${fieldName || 'foreign key'} does not exist`,
        details: {
          field: fieldName,
          constraint: 'foreign_key',
        },
      };
    }

    case 'P2014': {
      // Relation violation
      return {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'The change you are trying to make would violate a relation',
        details: {
          relation: error.meta?.relation_name,
        },
      };
    }

    case 'P2001': {
      // Record required but not found
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Required record not found',
      };
    }

    default: {
      // Generic database error
      return {
        statusCode: 500,
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
        details: process.env.NODE_ENV === 'development'
          ? { code: error.code, meta: error.meta }
          : undefined,
      };
    }
  }
}
