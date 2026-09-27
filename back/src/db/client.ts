import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const createSql = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return postgres(databaseUrl, { max: 10, idle_timeout: 20 });
};

let sql: ReturnType<typeof postgres> | undefined;

/**
 * The raw postgres.js client.
 *
 * Exposed so callers that need real multi-statement transactions can use
 * `sql.begin()`. Drizzle's own `db.transaction()` would also work, but keeping
 * the raw client around means a failure inside a transaction surfaces as a
 * rollback rather than a partially applied batch.
 */
export const getSql = () => {
  sql ??= createSql();
  return sql;
};

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export const getDb = () => {
  database ??= drizzle(getSql(), { schema });
  return database;
};

export type Database = ReturnType<typeof getDb>;
export type Sql = ReturnType<typeof postgres>;
