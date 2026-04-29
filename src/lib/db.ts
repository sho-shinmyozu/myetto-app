import { PrismaClient } from "@prisma/client";

const globalForDb = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    return new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN ?? "",
      }),
    });
  }

  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
  const path = require("path") as typeof import("path");
  const DB_PATH = path.resolve(process.cwd(), "dev.db");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: DB_PATH }) });
}

export const prisma = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = prisma;
}
