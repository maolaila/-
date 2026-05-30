import "./load-env";

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const args = new Set(process.argv.slice(2));
const requireSeed = args.has("--seed");
const checkDb = args.has("--db");
const checkStorage = args.has("--storage");

const failures: string[] = [];
const warnings: string[] = [];

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function fail(name: string, message: string) {
  failures.push(`${name}: ${message}`);
}

function warn(name: string, message: string) {
  warnings.push(`${name}: ${message}`);
}

function looksLikePlaceholder(value: string) {
  const lowered = value.toLowerCase();
  return (
    lowered.includes("replace-with") ||
    lowered.includes("your-") ||
    lowered.includes("example.com") ||
    lowered === "admin123456" ||
    lowered === "dev-session-secret" ||
    lowered === "dev-password-pepper"
  );
}

function requireValue(name: string) {
  const value = env(name);
  if (!value) {
    fail(name, "is required.");
    return "";
  }
  if (looksLikePlaceholder(value)) {
    fail(name, "still looks like a placeholder or development default.");
  }
  return value;
}

function requireMinLength(name: string, minLength: number) {
  const value = requireValue(name);
  if (value && value.length < minLength) {
    fail(name, `must be at least ${minLength} characters.`);
  }
  return value;
}

function parseUrl(name: string, value: string) {
  try {
    return new URL(value);
  } catch {
    fail(name, "must be a valid URL.");
    return null;
  }
}

function requirePostgresUrl(name: string) {
  const value = requireValue(name);
  if (!value) {
    return "";
  }
  const url = parseUrl(name, value);
  if (url && url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    fail(name, "must use postgres:// or postgresql://.");
  }
  return value;
}

function validateEnvironment() {
  const databaseUrl = requirePostgresUrl("DATABASE_URL");
  const directDatabaseUrl = requirePostgresUrl("DIRECT_DATABASE_URL");
  const appUrl = requireValue("NEXT_PUBLIC_APP_URL");
  const supabaseUrl = requireValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireMinLength("SUPABASE_SERVICE_ROLE_KEY", 40);
  const bucket = requireValue("SUPABASE_STORAGE_BUCKET");
  const storageDriver = requireValue("STORAGE_DRIVER");

  requireMinLength("SESSION_SECRET", 32);
  requireMinLength("PASSWORD_PEPPER", 16);

  if (process.env.NODE_ENV && process.env.NODE_ENV !== "production") {
    fail("NODE_ENV", "must not be set to a non-production value for deployment.");
  }

  if (storageDriver && storageDriver !== "supabase") {
    fail("STORAGE_DRIVER", "must be supabase in production.");
  }

  const parsedAppUrl = appUrl ? parseUrl("NEXT_PUBLIC_APP_URL", appUrl) : null;
  if (parsedAppUrl) {
    if (parsedAppUrl.protocol !== "https:") {
      fail("NEXT_PUBLIC_APP_URL", "must use https:// in production.");
    }
    if (["localhost", "127.0.0.1", "::1"].includes(parsedAppUrl.hostname)) {
      fail("NEXT_PUBLIC_APP_URL", "must not point to localhost in production.");
    }
  }

  const parsedSupabaseUrl = supabaseUrl ? parseUrl("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl) : null;
  if (parsedSupabaseUrl && parsedSupabaseUrl.protocol !== "https:") {
    fail("NEXT_PUBLIC_SUPABASE_URL", "must use https://.");
  }

  if (databaseUrl && directDatabaseUrl && databaseUrl === directDatabaseUrl) {
    warn("DIRECT_DATABASE_URL", "uses the same value as DATABASE_URL; Supabase direct and pooled URLs are usually different.");
  }

  if (serviceRoleKey && serviceRoleKey.length < 80) {
    warn("SUPABASE_SERVICE_ROLE_KEY", "is unusually short for a Supabase service role key.");
  }

  if (bucket && bucket !== "product-images") {
    warn("SUPABASE_STORAGE_BUCKET", "differs from the documented default product-images.");
  }

  if (process.env.ALLOW_INSECURE_SEED_DEFAULTS === "true") {
    fail("ALLOW_INSECURE_SEED_DEFAULTS", "must not be true for deployment.");
  }

  if (process.env.SEED_DEMO_DATA === "true") {
    warn("SEED_DEMO_DATA", "is true; production seed will include demo customer and product data.");
  }

  if (requireSeed) {
    const password = requireMinLength("SEED_ADMIN_PASSWORD", 12);
    if (password && password === env("SEED_ADMIN_USERNAME")) {
      fail("SEED_ADMIN_PASSWORD", "must not match SEED_ADMIN_USERNAME.");
    }
  }
}

async function validateDatabaseConnection() {
  const databaseUrl = env("DIRECT_DATABASE_URL") || env("DATABASE_URL");
  if (!databaseUrl || failures.some((item) => item.startsWith("DIRECT_DATABASE_URL") || item.startsWith("DATABASE_URL"))) {
    return;
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 10 });
  try {
    await sql`select 1`;
  } catch (error) {
    fail("DATABASE_CONNECTION", error instanceof Error ? error.message : String(error));
  } finally {
    await sql.end();
  }
}

async function validateSupabaseStorage() {
  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = env("SUPABASE_STORAGE_BUCKET");
  if (!supabaseUrl || !serviceRoleKey || !bucket || failures.some((item) => item.startsWith("NEXT_PUBLIC_SUPABASE_URL") || item.startsWith("SUPABASE_SERVICE_ROLE_KEY") || item.startsWith("SUPABASE_STORAGE_BUCKET"))) {
    return;
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
  const { data, error } = await client.storage.getBucket(bucket);
  if (error) {
    fail("SUPABASE_STORAGE_BUCKET", error.message);
    return;
  }

  const isPublic = typeof data === "object" && data !== null && "public" in data && data.public === true;
  if (!isPublic) {
    fail("SUPABASE_STORAGE_BUCKET", "bucket exists but is not marked public; product images will not render for shoppers.");
  }
}

async function main() {
  validateEnvironment();

  if (checkDb) {
    await validateDatabaseConnection();
  }
  if (checkStorage) {
    await validateSupabaseStorage();
  }

  if (warnings.length > 0) {
    console.warn("Deployment check warnings:");
    for (const item of warnings) {
      console.warn(`- ${item}`);
    }
  }

  if (failures.length > 0) {
    console.error("Deployment check failed:");
    for (const item of failures) {
      console.error(`- ${item}`);
    }
    process.exitCode = 1;
    return;
  }

  const extra = [requireSeed ? "seed" : null, checkDb ? "db" : null, checkStorage ? "storage" : null]
    .filter(Boolean)
    .join(", ");
  console.log(`Deployment check passed${extra ? ` (${extra})` : ""}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
