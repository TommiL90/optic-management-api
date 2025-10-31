/**
 * Base HTTP Exception class inspired by NestJS
 *
 * This class serves as the foundation for all HTTP-related exceptions in the application.
 * It extends the native Error class and adds HTTP-specific properties like status code,
 * error code, and optional details.
 *
 * @example
 * ```typescript
 * throw new HttpException(404, 'NOT_FOUND', 'Resource not found', { id: '123' });
 * ```
 */
export class HttpException extends Error {
  /**
   * Creates an HTTP exception
   *
   * @param statusCode - HTTP status code (e.g., 404, 500)
   * @param code - Business error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
   * @param message - Human-readable error message
   * @param details - Optional additional details about the error
   */
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the exception to a JSON-serializable object
   *
   * @returns Object representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
