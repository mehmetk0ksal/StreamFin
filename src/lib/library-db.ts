import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { pool } from './db';

const globals = globalThis as typeof globalThis & { libraryPrisma?: PrismaClient };
const prisma = globals.libraryPrisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });
if (process.env.NODE_ENV !== 'production') globals.libraryPrisma = prisma;

// Callers supply SQL templates with numbered placeholders. Values are always bound separately.
export function libraryQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(sql, ...params);
}

export function libraryTransaction<T>(work: (run: typeof libraryQuery) => Promise<T>): Promise<T> {
  return prisma.$transaction((tx) =>
    work(<Row>(sql: string, params: unknown[] = []) => tx.$queryRawUnsafe<Row[]>(sql, ...params))
  );
}
