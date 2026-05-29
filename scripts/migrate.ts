import "./load-env";

import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is required.");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

async function main() {
  await sql`
    create table if not exists _lc_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const already = await sql`select name from _lc_migrations where name = ${file}`;
    if (already.length > 0) {
      console.log(`skip ${file}`);
      continue;
    }

    const body = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into _lc_migrations (name) values (${file})`;
    });
    console.log(`applied ${file}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
