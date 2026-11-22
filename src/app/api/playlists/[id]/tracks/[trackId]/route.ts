import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string; trackId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
    const client = await pool.connect();
    try {
        const user = await requireAuth();
        const { id, trackId } = await context.params;
        const playlistId = Number(id);
        const playlistTrackId = Number(trackId);

        await client.query('BEGIN');

        const ownerCheck = await client.query(
            `SELECT playlist_id FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
            [playlistId, user.user_id]
        );
        if (ownerCheck.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Playlist not found or access denied.' }, { status: 403 });
        }

        const del = await client.query(
            `DELETE FROM playlist_tracks
       WHERE playlist_track_id = $1 AND playlist_id = $2
       RETURNING playlist_track_id`,
            [playlistTrackId, playlistId]
        );

        if (del.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Track not found in playlist.' }, { status: 404 });
        }

        // Kalan parçaların sıralamasını (1, 2, 3...) yeniden düzenle
        await client.query(
            `WITH reordered AS (
         SELECT playlist_track_id,
                ROW_NUMBER() OVER (ORDER BY track_order ASC) AS new_order
         FROM playlist_tracks
         WHERE playlist_id = $1
       )
       UPDATE playlist_tracks pt
       SET track_order = r.new_order
       FROM reordered r
       WHERE pt.playlist_track_id = r.playlist_track_id`,
            [playlistId]
        );

        await client.query(
            `UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE playlist_id = $1`,
            [playlistId]
        );

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Track removed from playlist.' });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        console.error('Delete track error:', err);
        return NextResponse.json({ error: 'Failed to remove track.' }, { status: 500 });
    } finally {
        client.release();
    }
}