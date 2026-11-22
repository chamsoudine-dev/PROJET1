import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sante_test?sslmode=require';

export const conn = globalForDb.conn ?? postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  ssl: connectionString.includes('localhost') ? false : 'require',
});

export const db = globalForDb.db ?? drizzle(conn, { schema, logger: process.env.NODE_ENV === 'development' });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
  globalForDb.db = db;
}

export type DB = typeof db;
export { schema };