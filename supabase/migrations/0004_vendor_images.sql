-- Vendor portrait images, mirrored from the GW2 Wiki's page lead image
-- (MediaWiki pageimages API). Populated by scripts/sync-vendor-images.mjs.
-- Apply with: npm run db:migrate -- supabase/migrations/0004_vendor_images.sql

alter table vendors add column if not exists icon text;
