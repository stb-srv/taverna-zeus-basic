-- Adds one level of subcategory nesting to menu_categories via a nullable
-- self-referencing parent_id. Capped at two levels total in the application
-- layer (saveCategory validation) - not enforceable as a simple DB constraint.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260714_menu_category_hierarchy.sql
-- Verify: select id, slug, parent_id from menu_categories limit 5;

alter table public.menu_categories
  add column if not exists parent_id uuid references public.menu_categories(id) on delete cascade;

create index if not exists menu_categories_parent_id_idx on public.menu_categories (parent_id);
