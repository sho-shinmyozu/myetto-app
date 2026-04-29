/**
 * DB 抽象化レイヤー
 *
 * 現在: better-sqlite3 (ローカル SQLite)
 * 将来: Turso (libSQL) へ切り替える場合は以下の手順:
 *   1. npm install @libsql/client
 *   2. .env に TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を追加
 *   3. USE_TURSO=true を .env に設定
 *   4. Prisma datasource を libsql に変更: provider = "sqlite", url = env("TURSO_DATABASE_URL")
 *
 * この抽象化により、アプリコードの変更なしに DB を切り替えられる。
 */

export type DbRow = Record<string, unknown>;

export interface DbAdapter {
  query<T = DbRow>(sql: string, params?: unknown[]): T[];
  queryOne<T = DbRow>(sql: string, params?: unknown[]): T | undefined;
  execute(sql: string, params?: unknown[]): void;
}

class SqliteAdapter implements DbAdapter {
  private get db() {
    const { getSqliteDb } = require("@/lib/db");
    return getSqliteDb();
  }

  query<T = DbRow>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  queryOne<T = DbRow>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  execute(sql: string, params: unknown[] = []): void {
    this.db.prepare(sql).run(...params);
  }
}

export function getDbAdapter(): DbAdapter {
  return new SqliteAdapter();
}
