-- Best-effort achievement location, parsed from the requirement text and matched
-- to the GW2 map (area -> map -> region). Each value is
-- { kind, name, zone, waypoint, chat, coord }. Populated by
-- scripts/sync-achievement-locations.mjs.
-- Apply with: npm run db:migrate -- supabase/migrations/0006_achievement_locations.sql

alter table achievements add column if not exists location jsonb;
