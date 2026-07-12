<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Structure & tests

- Admin server actions live per domain in `src/app/admin/actions/` (`settings`, `hours`, `menu`, `pages`, `translations`, `admins`, `menu-import`); shared guard/revalidate/translation helpers are in `actions/shared.ts`, pure `FormData` parsing in `src/lib/form-data.ts`. Keep new actions in their domain file — don't grow a monolith.
- `src/lib/supabase/types.ts` is generated from Supabase; never edit by hand.
- Unit tests: `npm test` (Vitest, files in `test/`). Before committing run `npm test`, `npm run lint`, and `npx tsc --noEmit`.
