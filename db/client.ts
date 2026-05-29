import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

let client: postgres.Sql | undefined;

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!client) {
    client = postgres(databaseUrl, {
      max: 10,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 15
    });
  }

  return client;
}

export function getDb() {
  return drizzle(getSql(), { schema });
}
