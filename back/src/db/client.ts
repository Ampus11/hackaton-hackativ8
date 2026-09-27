import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const createDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return drizzle(neon(databaseUrl), { schema });
};

let database: ReturnType<typeof createDatabase> | undefined;
let sql: ReturnType<typeof neon> | undefined;

/**
 * The raw Neon tagged template.
 *
 * `drizzle-orm/neon-http` has no interactive transactions, so multi-statement
 * work that must be atomic (guest import) is built from Drizzle queries via
 * `.toSQL()` and executed through Neon's batch `transaction()` instead, which
 * runs every statement in a single implicit transaction.
 */
export const getSql = () => {
  sql ??= neon(process.env.DATABASE_URL ?? "");
  return sql;
};

export const getDb = () => {
  database ??= createDatabase();
  return database;
};

export type Database = ReturnType<typeof createDatabase>;
export type Sql = ReturnType<typeof neon>;
