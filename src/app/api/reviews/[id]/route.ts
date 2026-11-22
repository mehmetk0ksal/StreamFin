import { requireAuth } from '@/lib/auth';
import { libraryQuery } from '@/lib/library-db';
import { integer, jsonBody, LibraryError, libraryErrorResponse, requireRecord, reviewText } from '@/lib/library-input';
import type { Review } from '@/lib/library-types';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
    try {
        const user = await requireAuth();
        const id = integer((await context.params).id, 'İnceleme kimliği');
        const body = await jsonBody(request);
        if (!('rating' in body || 'review_text' in body)) throw new LibraryError('Puan veya inceleme metni gönderin.');
        const rating = 'rating' in body ? integer(body.rating, 'Puan (1–10)', 1, 10) : null;
        const text = reviewText(body.review_text);
        const [updated] = await libraryQuery<Review>(
            `UPDATE media_reviews SET rating = COALESCE($3::smallint, rating),
                    review_text = CASE WHEN $4::boolean THEN $5::text ELSE review_text END,
                    updated_at = CURRENT_TIMESTAMP
             WHERE review_id = $1 AND user_id = $2
             RETURNING *, $6::text AS username`,
            [id, user.user_id, rating, 'review_text' in body, text, user.username]
        );
        return Response.json({ review: requireRecord(updated) });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}

export async function DELETE(_request: Request, context: Context) {
    try {
        const user = await requireAuth();
        const id = integer((await context.params).id, 'İnceleme kimliği');
        const [deleted] = await libraryQuery(
            'DELETE FROM media_reviews WHERE review_id = $1 AND user_id = $2 RETURNING review_id',
            [id, user.user_id]
        );
        requireRecord(deleted);
        return Response.json({ ok: true });
    } catch (error) {
        return libraryErrorResponse(error);
    }
}
