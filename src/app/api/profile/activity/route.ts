import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('q') || '').trim();
        const likePattern = `%${search}%`;

        // 4 kategoriyi paralel SQL sorgularıyla çek
        const [movieReviews, movieWatchlist, tvReviews, tvWatchlist, playlists, savedVideos] =
            await Promise.all([
                // Film İncelemeleri
                query(
                    `SELECT review_id, tmdb_id, media_title, rating, review_text, is_hidden, created_at
           FROM media_reviews
           WHERE user_id = $1 AND media_type = 'movie' AND media_title ILIKE $2
           ORDER BY created_at DESC`,
                    [user.user_id, likePattern]
                ),
                // Film İzleme Listesi
                query(
                    `SELECT watchlist_id, tmdb_id, media_title, poster_path, status, updated_at
           FROM watchlists
           WHERE user_id = $1 AND media_type = 'movie' AND media_title ILIKE $2
           ORDER BY updated_at DESC`,
                    [user.user_id, likePattern]
                ),
                // Dizi / Sezon / Bölüm İncelemeleri
                query(
                    `SELECT review_id, media_type, tmdb_id, season_number, episode_number,
                  media_title, rating, review_text, is_hidden, created_at
           FROM media_reviews
           WHERE user_id = $1
             AND media_type IN ('tv', 'season', 'episode')
             AND media_title ILIKE $2
           ORDER BY created_at DESC`,
                    [user.user_id, likePattern]
                ),
                // Dizi İzleme Listesi
                query(
                    `SELECT watchlist_id, tmdb_id, media_title, poster_path, status, updated_at
           FROM watchlists
           WHERE user_id = $1 AND media_type = 'tv' AND media_title ILIKE $2
           ORDER BY updated_at DESC`,
                    [user.user_id, likePattern]
                ),
                // Müzik Çalma Listeleri
                query(
                    `SELECT p.playlist_id, p.title, p.description, p.is_public, p.created_at,
                  COUNT(pt.playlist_track_id)::int AS track_count
           FROM playlists p
           LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
           WHERE p.user_id = $1 AND p.title ILIKE $2
           GROUP BY p.playlist_id
           ORDER BY p.updated_at DESC`,
                    [user.user_id, likePattern]
                ),
                // Kaydedilen YouTube Videoları
                query(
                    `SELECT saved_video_id, youtube_video_id, video_title, channel_title,
                  thumbnail_url, personal_note, saved_at
           FROM saved_videos
           WHERE user_id = $1 AND video_title ILIKE $2
           ORDER BY saved_at DESC`,
                    [user.user_id, likePattern]
                ),
            ]);

        return NextResponse.json({
            movies: {
                reviews: movieReviews.rows,
                watchlist: movieWatchlist.rows,
            },
            tv: {
                reviews: tvReviews.rows,
                watchlist: tvWatchlist.rows,
            },
            music: {
                playlists: playlists.rows,
            },
            videos: {
                saved: savedVideos.rows,
            },
        });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }
        console.error('Activity GET error:', err);
        return NextResponse.json({ error: 'Aktiviteler alınırken hata oluştu.' }, { status: 500 });
    }
}