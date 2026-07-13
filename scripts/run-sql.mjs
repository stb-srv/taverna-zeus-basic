/**
 * Runs a .sql file against the Supabase Postgres database (e.g. a migration
 * from supabase/migrations/). Reads DATABASE_URL from .env (Project Settings
 * → Database → Connection string → URI in Supabase).
 *
 * Run:  node scripts/run-sql.mjs supabase/migrations/<file>.sql
 */
import { readFileSync } from "node:fs";
import { Client } from "pg";

// --- Load .env into process.env (plain node doesn't do this). ---
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Fehlt: DATABASE_URL in .env (Supabase → Project Settings → Database → Connection string → URI).");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("Nutzung: node scripts/run-sql.mjs <pfad-zur-sql-datei>");
  process.exit(1);
}

const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ ${file} erfolgreich ausgeführt.`);
} catch (e) {
  console.error(`Fehler beim Ausführen von ${file}:`, e.message);
  process.exit(1);
} finally {
  await client.end();
}
