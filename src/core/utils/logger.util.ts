import { FastifyInstance } from 'fastify';

interface LogContext {
  [key: string]: any;
}

export class Logger {
  private static fastifyInstance: FastifyInstance | null = null;

  /**
   * Inicializa el Logger con la instancia de Fastify
   * Debe ser llamado una sola vez al inicio de la aplicación
   */
  static initialize(fastify: FastifyInstance): void {
    this.fastifyInstance = fastify;
  }

  /**
   * Obtiene la instancia de Fastify o lanza un error si no está inicializada
   */
  private static getFastifyInstance(): FastifyInstance {
    if (!this.fastifyInstance) {
      throw new Error('Logger not initialized. Call Logger.initialize() first.');
    }
    return this.fastifyInstance;
  }

  static info(message: string, context?: LogContext): void {
    this.getFastifyInstance().log.info(context, message);
  }

  static warn(message: string, context?: LogContext): void {
    this.getFastifyInstance().log.warn(context, message);
  }

  static error(message: string, context?: LogContext | Error): void {
    if (context instanceof Error) {
      this.getFastifyInstance().log.error({ err: context }, message);
    } else {
      this.getFastifyInstance().log.error(context, message);
    }
  }

  static debug(message: string, context?: LogContext): void {
    this.getFastifyInstance().log.debug(context, message);
  }

  static trace(message: string, context?: LogContext): void {
    this.getFastifyInstance().log.trace(context, message);
  }

  static fatal(message: string, context?: LogContext | Error): void {
    if (context instanceof Error) {
      this.getFastifyInstance().log.fatal({ err: context }, message);
    } else {
      this.getFastifyInstance().log.fatal(context, message);
    }
  }

  // Métodos específicos para diferentes contextos
  static httpRequest(method: string, url: string, statusCode: number, responseTime: number, additionalContext?: LogContext): void {
    const context: LogContext = {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      ...additionalContext
    };

    if (statusCode >= 500) {
      this.error(`HTTP ${method} ${url} ${statusCode}`, context);
    } else if (statusCode >= 400) {
      this.warn(`HTTP ${method} ${url} ${statusCode}`, context);
    } else {
      this.info(`HTTP ${method} ${url} ${statusCode}`, context);
    }
  }

  static databaseQuery(query: string, duration: number, additionalContext?: LogContext): void {
    this.debug('Database Query', {
      query: query.length > 200 ? `${query.substring(0, 200)}...` : query,
      duration: `${duration}ms`,
      ...additionalContext
    });
  }

  static businessLogic(operation: string, data?: LogContext): void {
    this.info(`Business Logic: ${operation}`, data);
  }

  static authentication(userId?: string, action: string = 'login', success: boolean = true): void {
    const level = success ? 'info' : 'warn';
    this[level](`Authentication: ${action}`, {
      userId,
      action,
      success,
      timestamp: new Date().toISOString()
    });
  }

  static authorization(userId: string, resource: string, action: string, granted: boolean): void {
    const level = granted ? 'info' : 'warn';
    this[level](`Authorization: ${action} on ${resource}`, {
      userId,
      resource,
      action,
      granted,
      timestamp: new Date().toISOString()
    });
  }
}
