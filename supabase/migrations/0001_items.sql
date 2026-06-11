-- buildop item database: static item metadata mirrored from the official GW2 API
-- (volatile Trading Post prices are NOT stored here — they stay live from the API).
-- Apply with: npm run db:migrate

create extension if not exists pg_trgm;

create table if not exists items (
  id            integer primary key,
  name          text not null,
  rarity        text,
  type          text,
  subtype       text,
  level         integer not null default 0,
  icon          text,
  vendor_value  integer not null default 0,
  flags         text[]  not null default '{}',
  chat_link     text,
  tradable      boolean not null default false,
  description   text,
  updated_at    timestamptz not null default now()
);

-- Fuzzy name search ("ecto" -> "Glob of Ectoplasm").
create index if not exists items_name_trgm on items using gin (name gin_trgm_ops);
-- Filter facets.
create index if not exists items_rarity_idx   on items (rarity);
create index if not exists items_type_idx      on items (type);
create index if not exists items_level_idx     on items (level);
create index if not exists items_tradable_idx  on items (tradable);

-- Public read-only access (only relevant if the table is ever queried with the
-- publishable/anon key from the browser; our server routes use the DB role and
-- bypass RLS). Writes happen only via the sync script using the service role.
alter table items enable row level security;
drop policy if exists "items public read" on items;
create policy "items public read" on items for select using (true);
