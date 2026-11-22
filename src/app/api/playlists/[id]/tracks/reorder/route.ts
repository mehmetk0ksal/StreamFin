import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
    const client = await pool.connect();
    try {
        const user = await requireAuth();
        const { id } = await context.params;
        const playlistId = Number(id);
        const { orderedTrackIds } = await request.json();

        if (!Array.isArray(orderedTrackIds) || orderedTrackIds.length === 0) {
            return NextResponse.json({ error: 'orderedTrackIds array is required.' }, { status: 400 });
        }

        await client.query('BEGIN');

        // Sahiplik kontrolü
        const ownerCheck = await client.query(
            `SELECT playlist_id FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
            [playlistId, user.user_id]
        );
        if (ownerCheck.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Playlist not found or access denied.' }, { status: 403 });
        }

        // Her parçanın yeni track_order değerini 1'den başlayarak güncelle
        for (let i = 0; i < orderedTrackIds.length; i++) {
            await client.query(
                `UPDATE playlist_tracks
         SET track_order = $1
         WHERE playlist_track_id = $2 AND playlist_id = $3`,
                [i + 1, Number(orderedTrackIds[i]), playlistId]
            );
        }

        await client.query(
            `UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE playlist_id = $1`,
            [playlistId]
        );

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Track order updated.' });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        console.error('Reorder tracks error:', err);
        return NextResponse.json({ error: 'Failed to reorder tracks.' }, { status: 500 });
    } finally {
        client.release();
    }
}