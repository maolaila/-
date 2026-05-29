import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is required for Drizzle.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl
  },
  strict: true,
  verbose: true
});
