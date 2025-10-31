import { PrismaClient } from '@prisma/client';

// Singleton pattern para evitar múltiples instancias
class PrismaService {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      });
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
