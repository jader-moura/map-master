import postgres from "postgres";

// Shared Postgres (Supabase) client for server-side queries. Lazy + cached on
// globalThis so Next's dev hot-reload doesn't open a new pool every reload.
// `prepare: false` keeps it compatible with Supabase's transaction pooler.
const g = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };

export function getSql() {
  if (!g.__sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__sql = postgres(url, { ssl: "require", prepare: false });
  }
  return g.__sql;
}
