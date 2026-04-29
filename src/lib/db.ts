import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "dev.db");

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlite: Database.Database | undefined;
};

// ✅ 通常のPrismaClient（まずはこれで安定させる）
export const prisma =
  globalForDb.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

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