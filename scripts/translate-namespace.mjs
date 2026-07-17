/**
 * One-time (re-runnable) generator for a top-level namespace in the bundled
 * `messages/<locale>.json` files. `messages/de.json` is the source of truth;
 * this fills in the same namespace for every other bundled locale
 * (`DEFAULT_ENABLED_LOCALES` minus "de") via the self-hosted LibreTranslate
 * instance — only the keys still missing/empty in a target file, so re-running
 * after adding new keys to the namespace doesn't retranslate what's already
 * there. ICU strings (containing `{`) are skipped, same as `ui-messages.ts`.
 *
 * Run:  node scripts/translate-namespace.mjs admin
 */
import { readFileSync, writeFileSync } from "node:fs";

const namespace = process.argv[2];
if (!namespace) {
  console.error("Nutzung: node scripts/translate-namespace.mjs <namespace>");
  process.exit(1);
}

// --- Load .env into process.env (plain node doesn't do this). ---
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const LT = (process.env.LIBRETRANSLATE_URL ?? "http://localhost:5000").replace(/\/+$/, "");
const LT_KEY = process.env.LIBRETRANSLATE_API_KEY;
const SOURCE = "de";
const TARGETS = ["en", "el", "ru", "pl", "nl", "ar", "es"];
// Kept in sync by hand with TRANSLATE_CHUNK_SIZE in src/i18n/translate.ts — this
// plain .mjs script can't import that server-only TS module directly (no
// TS-runner devDependency in this project), so the client is duplicated here.
const CHUNK = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function messagesPath(locale) {
  return new URL(`../messages/${locale}.json`, import.meta.url);
}

function flatten(tree, prefix = "") {
  return Object.entries(tree ?? {}).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value]]
      : flatten(value, `${prefix}${key}.`),
  );
}

function setPath(target, path, value) {
  const keys = path.split(".");
  let node = target;
  for (const key of keys.slice(0, -1)) {
    node = typeof node[key] === "object" && node[key] !== null ? node[key] : (node[key] = {});
  }
  node[keys[keys.length - 1]] = value;
}

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
  }
  return out;
}

async function run() {
  const de = JSON.parse(readFileSync(messagesPath(SOURCE), "utf8"));
  const source = de[namespace];
  if (!source) {
    console.error(`"${namespace}" existiert nicht in messages/de.json`);
    process.exit(1);
  }
  const sourceEntries = flatten(source).filter(([, v]) => !v.includes("{"));

  try {
    await fetch(`${LT}/languages`).then((r) => r.json());
  } catch {
    console.error(`LibreTranslate nicht erreichbar unter ${LT}.`);
    process.exit(1);
  }

  for (const target of TARGETS) {
    const path = messagesPath(target);
    const data = JSON.parse(readFileSync(path, "utf8"));
    const existing = data[namespace] ?? {};
    const existingFlat = new Map(flatten(existing));

    const pending = sourceEntries.filter(([key]) => !existingFlat.get(key));
    if (pending.length === 0) {
      console.log(`✓ ${target}: bereits vollständig`);
      continue;
    }

    const translated = await translate(pending.map(([, v]) => v), target);
    pending.forEach(([key], i) => {
      if (translated[i]) setPath(existing, key, translated[i]);
    });
    data[namespace] = existing;
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
    console.log(`✓ ${target}: ${pending.length} Einträge übersetzt`);
  }
  console.log("\nFertig.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
