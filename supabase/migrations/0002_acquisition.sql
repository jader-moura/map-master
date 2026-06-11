-- Acquisition edges + vendors, mirrored from the GW2 Wiki's structured data
-- (the official API has no vendor/NPC/acquisition concept). Populated by
-- scripts/sync-wiki.mjs.  Apply with: npm run db:migrate -- supabase/migrations/0002_acquisition.sql

-- One row per (item, how-you-get-it, source). source_type is one of:
--   sold_by | contained_in | salvaged_from | rewarded_by
-- Keyed by item NAME (the wiki's unit), matching how item pages look it up.
create table if not exists item_sources (
  id           bigserial primary key,
  item_name    text not null,
  source_type  text not null,
  source_name  text not null,
  source_slug  text,
  cost         text,
  updated_at   timestamptz not null default now(),
  unique (item_name, source_type, source_name)
);

create index if not exists item_sources_item_idx on item_sources (item_name);
create index if not exists item_sources_src_idx  on item_sources (source_type, source_slug);

-- Vendors derived from the sold_by edges, so each can have its own page.
create table if not exists vendors (
  slug        text primary key,
  name        text not null,
  updated_at  timestamptz not null default now()
);

alter table item_sources enable row level security;
drop policy if exists "item_sources read" on item_sources;
create policy "item_sources read" on item_sources for select using (true);

alter table vendors enable row level security;
drop policy if exists "vendors read" on vendors;
create policy "vendors read" on vendors for select using (true);
