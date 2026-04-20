import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

export class SQLDatabase {
  private static dbInstance: PrismaClient;

  private constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = new PrismaPg({ connectionString });
    SQLDatabase.dbInstance = new PrismaClient({ adapter });
  }

  static getInstance(): PrismaClient {
    if (!SQLDatabase.dbInstance) {
      new SQLDatabase();
    }

    return SQLDatabase.dbInstance;
  }
}
