-- Existing StreamFin databases. Fresh databases receive these indexes in schema.sql.
BEGIN;
CREATE INDEX IF NOT EXISTS media_reviews_public_target_idx
    ON media_reviews (media_type, tmdb_id, season_number, episode_number)
    WHERE is_hidden = FALSE;

CREATE INDEX IF NOT EXISTS media_reviews_user_updated_idx
    ON media_reviews (user_id, updated_at DESC, review_id DESC);

CREATE INDEX IF NOT EXISTS watchlists_user_updated_idx
    ON watchlists (user_id, updated_at DESC, watchlist_id DESC);
COMMIT;
