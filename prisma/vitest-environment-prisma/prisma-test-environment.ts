import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Entorno de Vitest para Prisma con PostgreSQL
 * Crea un schema único por suite y limpia al finalizar.
 * Optimizado para usar mínimos recursos (configuración de conexiones reducida).
 */
export default {
  name: 'prisma',
  transformMode: 'ssr',
  async setup() {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('Please provide a DATABASE_URL environment variable.');
    }

    const schema = randomUUID();
    const url = new URL(baseUrl);
    url.searchParams.set('schema', schema);
    // Optimización: limitar conexiones para usar menos recursos (max_connections=20 en PostgreSQL)
    url.searchParams.set('connection_limit', '2'); // Solo 2 conexiones por suite de tests
    url.searchParams.set('pool_timeout', '20'); // Timeout aumentado para evitar advisory locks
    url.searchParams.set('connect_timeout', '10'); // Timeout de conexión
    const databaseUrl = url.toString();

    // Establecer DATABASE_URL para esta suite
    process.env.DATABASE_URL = databaseUrl;

    // Crear el schema explícitamente antes de migrar (idempotente)
    // Usar configuración mínima de conexiones para tests
    const bootstrapPrisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: process.env.DEBUG ? ['error', 'warn'] : [], // Solo errores en producción
    });
    
    try {
      await bootstrapPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    } finally {
      // Asegurar cierre inmediato para liberar recursos
      await bootstrapPrisma.$disconnect();
    }

    // Ejecutar migraciones contra el schema aislado
    // Retry logic para manejar advisory locks cuando múltiples tests corren en paralelo
    let retries = 3;
    let lastError: Error | null = null;
    while (retries > 0) {
      try {
        execSync('npx prisma migrate deploy', {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
            PRISMA_MIGRATE_SKIP_SEED: 'true',
          },
          timeout: 30000, // 30 segundos timeout
        });
        break; // Éxito, salir del loop
      } catch (error) {
        lastError = error as Error;
        retries--;
        if (retries > 0) {
          // Esperar un tiempo aleatorio entre 100-500ms antes de reintentar
          const waitTime = Math.floor(Math.random() * 400) + 100;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (retries === 0 && lastError) {
      throw new Error(`Failed to run migrations after 3 retries: ${lastError.message}`);
    }

    return {
      async teardown() {
        // Eliminar el schema de pruebas
        const client = new PrismaClient({
          datasources: { db: { url: databaseUrl } },
          log: [], // Sin logs en teardown para mejor rendimiento
        });
        try {
          await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        } catch (error) {
          // Ignorar errores si el schema ya fue eliminado
          if (error instanceof Error && !error.message.includes('does not exist')) {
            console.warn(`Error al eliminar schema ${schema}:`, error.message);
          }
        } finally {
          // Asegurar cierre inmediato para liberar recursos
          await client.$disconnect();
        }
      },
    };
  },
};
