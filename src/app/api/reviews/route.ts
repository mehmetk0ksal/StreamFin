import { getCurrentUser, requireAuth } from '@/lib/auth';
import { libraryQuery, libraryTransaction } from '@/lib/library-db';
import {
    integer, jsonBody, LibraryError, libraryErrorResponse, mediaTitle,
    reviewCoordinates, reviewText, reviewType, searchPattern,
} from '@/lib/library-input';
import type { Review, ReviewList } from '@/lib/library-types';

export async function GET(request: Request) {
    try {
        const params = new URL(request.url).searchParams;
        const mine = params.get('mine') === '1';
        const user = mine ? await requireAuth() : await getCurrentUser();
        const type = params.has('media_type') ? reviewType(params.get('media_type')) : null;
        const id = params.has('tmdb_id') ? integer(params.get('tmdb_id'), 'TMDB kimliği') : null;
        if (!mine && (!type || !id)) throw new LibraryError('İçerik türünü ve TMDB kimliğini belirtin.');

        const season = params.get('season_number');
        const episode = params.get('episode_number');
        if (!type && (season !== null || episode !== null)) throw new LibraryError('İçerik türünü belirtin.');
        const target = type && (id || season !== null || episode !== null)
            ? reviewCoordinates(type, season, episode) : null;
        const [result] = await libraryQuery<Omit<ReviewList, 'current_user_id'>>(
            `WITH matches AS (
                SELECT r.*, u.username
                FROM media_reviews r JOIN users u ON u.user_id = r.user_id
                WHERE (CASE WHEN $1::integer IS NULL THEN NOT r.is_hidden ELSE r.user_id = $1 END)
                  AND ($2::text IS NULL OR r.media_type = $2)
                  AND ($3::integer IS NULL OR r.tmdb_id = $3)
                  AND ($4::integer IS NULL OR r.season_number = $4)
                  AND ($5::integer IS NULL OR r.episode_number = $5)
                  AND ($6::text IS NULL OR r.media_title ILIKE $6 OR r.review_text ILIKE $6)
            )
            SELECT COALESCE(json_agg(matches ORDER BY updated_at DESC, review_id DESC), '[]'::json) AS reviews,
                   ROUND(AVG(rating), 1)::double precision AS average_rating, COUNT(*)::int AS review_count
            FROM matches`,
            [mine ? user!.user_id : null, type, id, target?.season ?? null, target?.episode ?? null,
                searchPattern(params.get('q'))]
        );
        return Response.json({ ...result, current_user_id: user?.user_id ?? null }, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const body = await jsonBody(request);
        const type = reviewType(body.media_type);
        const id = integer(body.tmdb_id, 'TMDB kimliği');
        const { season, episode } = reviewCoordinates(type, body.season_number, body.episode_number);
        const title = mediaTitle(body.media_title);
        const rating = integer(body.rating, 'Puan (1–10)', 1, 10);
        const text = reviewText(body.review_text);

        const review = await libraryTransaction(async (run) => {
            // The original shared schema has no unique key on reviews. Serialize concurrent
            // submissions by this user, including when season/episode are NULL.
            await run('SELECT user_id FROM users WHERE user_id = $1 FOR NO KEY UPDATE', [user.user_id]);
            const [row] = await run<Review>(
                `INSERT INTO media_reviews (user_id, media_type, tmdb_id, season_number, episode_number, media_title, rating, review_text)
                 SELECT $1::int, $2::text, $3::int, $4::int, $5::int, $6::text, $7::smallint, $8::text
                 WHERE NOT EXISTS (
                     SELECT 1 FROM media_reviews WHERE user_id = $1 AND media_type = $2 AND tmdb_id = $3
                       AND season_number IS NOT DISTINCT FROM $4 AND episode_number IS NOT DISTINCT FROM $5
                 )
                 RETURNING *, $9::text AS username`,
                [user.user_id, type, id, season, episode, title, rating, text, user.username]
            );
            if (!row) throw new LibraryError('Bu içerik için zaten bir incelemeniz var. Mevcut incelemenizi düzenleyebilirsiniz.', 409);
            return row;
        });
        return Response.json({ review }, { status: 201 });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}
