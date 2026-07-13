<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Structure & tests

- Admin server actions live per domain in `src/app/admin/actions/` (`settings`, `hours`, `menu`, `pages`, `translations`, `admins`, `menu-import`); shared guard/revalidate/translation helpers are in `actions/shared.ts`, pure `FormData` parsing in `src/lib/form-data.ts`. Keep new actions in their domain file — don't grow a monolith.
- `src/lib/supabase/types.ts` is generated from Supabase; never edit by hand.
- All content is machine-translated from DE via self-hosted LibreTranslate. The routable locale superset lives in `src/i18n/routing.ts`; which locales are ACTIVE comes from the DB (`restaurant_settings.enabled_locales`, read via `getEnabledLocales()` in `src/lib/locales.ts`) and is managed at `/admin/translations` — never hardcode a locale list in features. New translatable `<field>_i18n` columns MUST be registered in `TRANSLATABLE_TABLES` (`src/lib/translation-status.ts`) so the admin status page and the bulk backfill cover them, and their save action must call `fillTranslations`.
- Unit tests: `npm test` (Vitest, files in `test/`). Before committing run `npm test`, `npm run lint`, and `npx tsc --noEmit`.
- SQL migrations live in `supabase/migrations/`. Run one against the live DB with `node scripts/run-sql.mjs supabase/migrations/<file>.sql` (needs `DATABASE_URL` in `.env` — use the Supavisor **pooler** connection string from Supabase → Project Settings → Database → Connection string, port 6543; the direct `db.<ref>.supabase.co:5432` host is IPv6-only and unreachable from IPv4-only networks/sandboxes). A migration written but never run is a common source of "column does not exist" errors in production — after adding one, run it and verify (e.g. `SELECT` the new column) before considering the feature done.
- The Docker build (`node:22-alpine`) uses **npm 10**, while this machine may have a newer local npm. A `package-lock.json` regenerated with a newer npm can drop nested-dependency entries (e.g. `next-intl`'s own `@swc/helpers`) that npm 10's stricter `npm ci` then reports as "Missing … from lock file". After `npm install`/`npm install -D <pkg>`, regenerate with `npx -y npm@10 install` and verify with a clean `npx -y npm@10 ci` before pushing, or the next deployment fails.
