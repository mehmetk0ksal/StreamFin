import { requireAuth } from '@/lib/auth';
import { libraryQuery } from '@/lib/library-db';
import { integer, jsonBody, libraryErrorResponse, requireRecord, watchStatus } from '@/lib/library-input';
import type { WatchlistEntry } from '@/lib/library-types';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
    try {
        const user = await requireAuth();
        const id = integer((await context.params).id, 'Liste kaydı kimliği');
        const status = watchStatus((await jsonBody(request)).status);
        const [entry] = await libraryQuery<WatchlistEntry>(
            `UPDATE watchlists SET status = $3, updated_at = CURRENT_TIMESTAMP
             WHERE watchlist_id = $1 AND user_id = $2 RETURNING *`,
            [id, user.user_id, status]
        );
        return Response.json({ entry: requireRecord(entry) });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}

export async function DELETE(_request: Request, context: Context) {
    try {
        const user = await requireAuth();
        const id = integer((await context.params).id, 'Liste kaydı kimliği');
        const [deleted] = await libraryQuery(
            'DELETE FROM watchlists WHERE watchlist_id = $1 AND user_id = $2 RETURNING watchlist_id',
            [id, user.user_id]
        );
        requireRecord(deleted);
        return Response.json({ ok: true });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}
