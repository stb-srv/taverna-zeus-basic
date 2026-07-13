/**
 * One-time (re-runnable) backfill: translates existing DE content into the
 * additional locales via a self-hosted LibreTranslate instance and writes the
 * results into the `*_i18n` JSONB columns. Only fills empty locales — never
 * overwrites values that already exist.
 *
 * Prerequisites:
 *   1. LibreTranslate running with the target languages loaded, e.g.:
 *      docker run -ti -p 5000:5000 libretranslate/libretranslate \
 *        --load-only en,de,el,ru,pl,nl,ar,es
 *      A language missing from --load-only fails with "<code> is not
 *      supported" — see DEPLOY.md for the full locale list (src/i18n/routing.ts).
 *   2. .env.local with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 *
 * Run:  node scripts/backfill-i18n.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- Load .env.local into process.env (plain node doesn't do this). ---
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const LT = (process.env.LIBRETRANSLATE_URL ?? "http://localhost:5000").replace(/\/+$/, "");
const LT_KEY = process.env.LIBRETRANSLATE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Fehlt: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const SOURCE = "de";
const TARGETS = ["en", "el", "ru", "pl", "nl", "ar", "es"];

const CHUNK = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateChunk(texts, target) {
  const res = await fetch(`${LT}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, source: SOURCE, target, format: "text", ...(LT_KEY ? { api_key: LT_KEY } : {}) }),
  });
  if (!res.ok) throw new Error(`LibreTranslate ${res.status} for ${target}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  return Array.isArray(data.translatedText) ? data.translatedText : [data.translatedText];
}

/**
 * Translate an array DE→target in small chunks (large batches trip the proxy's
 * gateway timeout), with a few retries per chunk for transient 502/504s.
 */
async function translate(texts, target) {
  const out = [];
  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK);
    let attempt = 0;
    for (;;) {
      try {
        out.push(...(await translateChunk(chunk, target)));
        break;
      } catch (e) {
        if (++attempt >= 4) throw e;
        await sleep(3000);
      }
    }
    process.stdout.write(`      ${target}: ${Math.min(i + CHUNK, texts.length)}/${texts.length}\r`);
  }
  return out;
}

const TABLES = [
  { table: "menu_categories", fields: ["name", "description"] },
  { table: "menu_items", fields: ["name", "description"] },
  { table: "pages", fields: ["title", "content"] },
  { table: "restaurant_settings", fields: ["description"] },
  { table: "allergens", fields: ["name"] },
  { table: "additives", fields: ["name"] },
];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function run() {
  // Sanity check LibreTranslate is up.
  try {
    await fetch(`${LT}/languages`).then((r) => r.json());
  } catch {
    console.error(`LibreTranslate nicht erreichbar unter ${LT}. Container starten und erneut ausführen.`);
    process.exit(1);
  }

  for (const { table, fields } of TABLES) {
    const cols = ["id", ...fields.flatMap((f) => [`${f}_de`, `${f}_i18n`])].join(", ");
    const { data: rows, error } = await supabase.from(table).select(cols);
    if (error) {
      console.error(`  ${table}: ${error.message}`);
      continue;
    }
    // Accumulate new i18n maps per row.
    const patch = new Map(); // id -> { field -> map }
    for (const r of rows) {
      patch.set(r.id, Object.fromEntries(fields.map((f) => [f, { ...(r[`${f}_i18n`] ?? {}) }])));
    }

    for (const field of fields) {
      for (const target of TARGETS) {
        const pending = rows.filter((r) => {
          const src = r[`${field}_de`];
          return src && !patch.get(r.id)[field][target];
        });
        if (pending.length === 0) continue;
        const out = await translate(pending.map((r) => r[`${field}_de`]), target);
        pending.forEach((r, i) => {
          if (out[i]) patch.get(r.id)[field][target] = out[i];
        });
        process.stdout.write(`  ${table}.${field} → ${target}: ${pending.length}\n`);
      }
    }

    // Ensure DE stays authoritative, then write.
    let updated = 0;
    for (const r of rows) {
      const set = {};
      for (const f of fields) {
        const map = patch.get(r.id)[f];
        if (r[`${f}_de`]) map[SOURCE] = r[`${f}_de`];
        set[`${f}_i18n`] = map;
      }
      const { error: upErr } = await supabase.from(table).update(set).eq("id", r.id);
      if (upErr) console.error(`    update ${table} ${r.id}: ${upErr.message}`);
      else updated++;
    }
    console.log(`✓ ${table}: ${updated}/${rows.length} aktualisiert`);
  }
  console.log("\nFertig.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
