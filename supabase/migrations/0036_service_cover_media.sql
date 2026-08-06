-- =============================================================================
-- 0036_service_cover_media.sql
--
-- Cover media for a service, from the "Cover Image" field in the Stitch
-- design's Service Configuration pane.
--
-- Almost nothing else in that design needs schema, which is the point of
-- services being pages: SEO already lives on page_versions.seo, visibility is
-- pages.status, history is page_versions, and the pricing tiers are block data
-- the repeater already edits.
--
-- The SEO completeness score the design shows as "72%" is deliberately NOT a
-- column. It is computed in lib/seo-score.ts from which fields are actually
-- filled, so it cannot report 72% for a page whose description was cleared five
-- minutes ago — the same reason no money is stored on an invoice.
--
-- SAFE TO RE-RUN. Requires 0028_service_catalogue.sql.
-- =============================================================================

alter table public.service_details
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text;

comment on column public.service_details.cover_image_alt is
  'Alt text captured with the image so the two cannot drift apart — the media '
  'picker supplies both together.';

select private.record_migration('0036', 'service_cover_media');
