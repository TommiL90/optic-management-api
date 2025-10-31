import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Entorno de Vitest para Prisma con PostgreSQL
 * Crea un schema único por suite y limpia al finalizar.
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
    const databaseUrl = url.toString();

    // Establecer DATABASE_URL para esta suite
    process.env.DATABASE_URL = databaseUrl;

    // Crear el schema explícitamente antes de migrar (idempotente)
    const bootstrapPrisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    await bootstrapPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await bootstrapPrisma.$disconnect();

    // Ejecutar migraciones contra el schema aislado
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });

    return {
      async teardown() {
        // Eliminar el schema de pruebas
        const client = new PrismaClient({
          datasources: { db: { url: databaseUrl } },
        });
        try {
          await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        } finally {
          await client.$disconnect();
        }
      },
    };
  },
};
