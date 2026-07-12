<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Structure & tests

- Admin server actions live per domain in `src/app/admin/actions/` (`settings`, `hours`, `menu`, `pages`, `translations`, `admins`, `menu-import`); shared guard/revalidate/translation helpers are in `actions/shared.ts`, pure `FormData` parsing in `src/lib/form-data.ts`. Keep new actions in their domain file — don't grow a monolith.
- `src/lib/supabase/types.ts` is generated from Supabase; never edit by hand.
- All content is machine-translated from DE via self-hosted LibreTranslate. The routable locale superset lives in `src/i18n/routing.ts`; which locales are ACTIVE comes from the DB (`restaurant_settings.enabled_locales`, read via `getEnabledLocales()` in `src/lib/locales.ts`) and is managed at `/admin/translations` — never hardcode a locale list in features. New translatable `<field>_i18n` columns MUST be registered in `TRANSLATABLE_TABLES` (`src/lib/translation-status.ts`) so the admin status page and the bulk backfill cover them, and their save action must call `fillTranslations`.
- Unit tests: `npm test` (Vitest, files in `test/`). Before committing run `npm test`, `npm run lint`, and `npx tsc --noEmit`.
