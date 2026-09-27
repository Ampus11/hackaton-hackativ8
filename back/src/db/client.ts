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

export const getDb = () => {
  database ??= createDatabase();
  return database;
};

export type Database = ReturnType<typeof createDatabase>;
