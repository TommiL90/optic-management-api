import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

// Singleton pattern para evitar múltiples instancias
class PrismaService {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      const databaseUrl = process.env.DATABASE_URL || '';

      // Check if using Turso/libSQL
      if (databaseUrl.startsWith('libsql://')) {
        const libsqlClient = createClient({
          url: databaseUrl,
        });

        const adapter = new PrismaLibSQL(libsqlClient);

        this.instance = new PrismaClient({
          adapter,
          log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
          errorFormat: 'pretty',
        });
      } else {
        // Use standard SQLite connection
        this.instance = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
          errorFormat: 'pretty',
        });
      }
    }

    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
    }
  }

  static async connect(): Promise<void> {
    const instance = this.getInstance();
    await instance.$connect();
  }
}

// Exportar instancia singleton
export const prisma = PrismaService.getInstance();

// Exportar métodos de gestión
export const prismaService = {
  connect: () => PrismaService.connect(),
  disconnect: () => PrismaService.disconnect(),
  getInstance: () => PrismaService.getInstance(),
};
