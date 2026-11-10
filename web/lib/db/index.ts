import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export * from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

/** 数据库未配置时抛出，路由层统一转成 503 */
export class DatabaseNotConfiguredError extends Error {
  readonly code = 'DATABASE_NOT_CONFIGURED';

  constructor(message = '服务端未配置 DATABASE_URL，数据库相关功能不可用') {
    super(message);
    this.name = 'DatabaseNotConfiguredError';
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

/**
 * 注意：模块顶层不抛异常，缺少 DATABASE_URL 时 db 为 null，
 * 避免 `next build` 期间静态分析直接失败。
 */
export const db: Database | null = databaseUrl
  ? drizzle(postgres(databaseUrl, { max: 5, prepare: false, idle_timeout: 20 }), { schema })
  : null;

export const isDatabaseConfigured = Boolean(databaseUrl);

/** 需要数据库的路由统一走这里，未配置时抛出可识别的错误 */
export function getDb(): Database {
  if (!db) throw new DatabaseNotConfiguredError();
  return db;
}
