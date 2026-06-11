// Apply a SQL migration file to the database.
// Usage: node --env-file=.env.local scripts/migrate.mjs [path/to/file.sql]
import postgres from "postgres";
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "supabase/migrations/0001_items.sql";
const ddl = readFileSync(file, "utf8");

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });
try {
  await sql.unsafe(ddl);
  console.log(`Migration applied: ${file}`);
} finally {
  await sql.end();
}
