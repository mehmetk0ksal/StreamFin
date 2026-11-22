import { requireAuth } from '@/lib/auth';
import { libraryQuery } from '@/lib/library-db';
import {
    integer, jsonBody, libraryErrorResponse, mediaTitle, posterPath, searchPattern, watchStatus, watchType,
} from '@/lib/library-input';
import type { WatchlistEntry } from '@/lib/library-types';

export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const params = new URL(request.url).searchParams;
        const type = params.has('media_type') ? watchType(params.get('media_type')) : null;
        const id = params.has('tmdb_id') ? integer(params.get('tmdb_id'), 'TMDB kimliği') : null;
        const status = params.has('status') ? watchStatus(params.get('status')) : null;
        const watchlist = await libraryQuery<WatchlistEntry>(
            `SELECT * FROM watchlists
             WHERE user_id = $1 AND ($2::text IS NULL OR media_type = $2)
               AND ($3::integer IS NULL OR tmdb_id = $3)
               AND ($4::text IS NULL OR status = $4)
               AND ($5::text IS NULL OR media_title ILIKE $5)
             ORDER BY updated_at DESC, watchlist_id DESC`,
            [user.user_id, type, id, status, searchPattern(params.get('q'))]
        );
        return Response.json({ watchlist }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const body = await jsonBody(request);
        const type = watchType(body.media_type);
        const id = integer(body.tmdb_id, 'TMDB kimliği');
        const title = mediaTitle(body.media_title);
        const poster = posterPath(body.poster_path);
        const status = watchStatus(body.status);
        const [entry] = await libraryQuery<WatchlistEntry>(
            `INSERT INTO watchlists (user_id, media_type, tmdb_id, media_title, poster_path, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, media_type, tmdb_id) DO UPDATE
                SET media_title = EXCLUDED.media_title, poster_path = EXCLUDED.poster_path,
                    status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [user.user_id, type, id, title, poster, status]
        );
        return Response.json({ entry });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}
