import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "dev.db");

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlite: Database.Database | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: DB_PATH });
  return new PrismaClient({ adapter });
}

export const prisma = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = prisma;
}

// SQLite直接使う場合のみ
export function getSqliteDb(): Database.Database {
  if (!globalForDb.sqlite) {
    globalForDb.sqlite = new Database(DB_PATH);
    globalForDb.sqlite.pragma("journal_mode = WAL");
    globalForDb.sqlite.pragma("foreign_keys = ON");
  }
  return globalForDb.sqlite;
}