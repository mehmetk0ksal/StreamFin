-- ==========================================
-- 1. ROLES AND USERS
-- ==========================================
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL UNIQUE CHECK (role_name IN ('admin', 'user'))
);

-- Default roles
INSERT INTO roles (role_name) VALUES ('user'), ('admin');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) DEFAULT 1,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. MUSIC AND PLAYLISTS
-- ==========================================
CREATE TABLE playlists (
    playlist_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    description TEXT DEFAULT '',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE playlist_tracks (
    playlist_track_id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    audius_track_id VARCHAR(100) NOT NULL,
    track_title VARCHAR(200) NOT NULL,
    artist_name VARCHAR(150) NOT NULL,
    artwork_url TEXT,
    duration_seconds INTEGER CHECK (duration_seconds >= 0),
    track_order INTEGER NOT NULL CHECK (track_order > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (playlist_id, audius_track_id)
);

-- ==========================================
-- 3. FILM AND SERIES REVIEWS AND WATCHLISTS (TMDB - Kerem)
-- ==========================================
CREATE TABLE media_reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('movie', 'tv', 'season', 'episode')),
    tmdb_id INTEGER NOT NULL,
    season_number INTEGER CHECK (season_number >= 0),
    episode_number INTEGER CHECK (episode_number >= 0),
    media_title VARCHAR(255) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
    review_text TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watchlists (
    watchlist_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
    tmdb_id INTEGER NOT NULL,
    media_title VARCHAR(255) NOT NULL,
    poster_path TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('plan_to_watch', 'watching', 'completed', 'dropped')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, media_type, tmdb_id)
);

-- ==========================================
-- 4. SAVED YOUTUBE VIDEOS
-- ==========================================
CREATE TABLE saved_videos (
    saved_video_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    youtube_video_id VARCHAR(50) NOT NULL,
    video_title VARCHAR(255) NOT NULL,
    channel_title VARCHAR(150),
    thumbnail_url TEXT,
    personal_note TEXT DEFAULT '',
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, youtube_video_id)
);

-- ==========================================
-- 5. ADMIN MODERATION LOGS
-- ==========================================
CREATE TABLE moderation_logs (
    log_id SERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL REFERENCES users(user_id),
    review_id INTEGER NOT NULL REFERENCES media_reviews(review_id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('hide', 'unhide', 'delete')),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);