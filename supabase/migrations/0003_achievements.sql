-- Achievements + collections, mirrored from /v2/achievements. Collections are
-- achievements with type = 'ItemSet'. Populated by scripts/sync-achievements.mjs.
-- Apply with: npm run db:migrate -- supabase/migrations/0003_achievements.sql

create table if not exists achievements (
  id           integer primary key,
  name         text not null,
  description  text,
  requirement  text,
  type         text,                  -- 'Default' | 'ItemSet' (collection)
  flags        text[] not null default '{}',
  point_cap    integer,
  icon         text,
  updated_at   timestamptz not null default now()
);

create index if not exists achievements_name_trgm on achievements using gin (name gin_trgm_ops);
create index if not exists achievements_type_idx  on achievements (type);

-- Items tied to an achievement: role 'collect' (a collection bit) or 'reward'.
create table if not exists achievement_items (
  achievement_id integer not null,
  item_id        integer not null,
  role           text not null,
  unique (achievement_id, item_id, role)
);

create index if not exists achievement_items_item_idx on achievement_items (item_id, role);
create index if not exists achievement_items_ach_idx  on achievement_items (achievement_id, role);

alter table achievements enable row level security;
drop policy if exists "achievements read" on achievements;
create policy "achievements read" on achievements for select using (true);

alter table achievement_items enable row level security;
drop policy if exists "achievement_items read" on achievement_items;
create policy "achievement_items read" on achievement_items for select using (true);
