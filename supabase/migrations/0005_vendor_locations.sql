-- Vendor locations + nearest-waypoint chat codes. Each element is
-- { area, zone, waypoint, chat }, derived by matching the wiki's Located_in
-- areas to the nearest GW2 API waypoint. Populated by scripts/sync-vendor-locations.mjs.
-- Apply with: npm run db:migrate -- supabase/migrations/0005_vendor_locations.sql

alter table vendors add column if not exists locations jsonb not null default '[]'::jsonb;
