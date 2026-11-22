import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;
        const playlistId = Number(id);

        if (!playlistId) {
            return NextResponse.json({ error: 'Invalid playlist ID.' }, { status: 400 });
        }

        const plRes = await query(
            `SELECT playlist_id, user_id, title, description, is_public, created_at, updated_at
       FROM playlists
       WHERE playlist_id = $1`,
            [playlistId]
        );

        const playlist = plRes.rows[0];
        if (!playlist) {
            return NextResponse.json({ error: 'Playlist not found.' }, { status: 404 });
        }

        if (playlist.user_id !== user.user_id && !playlist.is_public && user.role_name !== 'admin') {
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }

        // Parçaları track_order sırasına göre getir
        const tracksRes = await query(
            `SELECT playlist_track_id, playlist_id, audius_track_id, track_title,
              artist_name, artwork_url, duration_seconds, track_order, added_at
       FROM playlist_tracks
       WHERE playlist_id = $1
       ORDER BY track_order ASC`,
            [playlistId]
        );

        return NextResponse.json({ playlist, tracks: tracksRes.rows });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        console.error('Playlist detail GET error:', err);
        return NextResponse.json({ error: 'Failed to load playlist details.' }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;
        const playlistId = Number(id);
        const { title, description, is_public } = await request.json();

        if (!title || title.trim().length < 2) {
            return NextResponse.json(
                { error: 'Playlist title must be at least 2 characters.' },
                { status: 400 }
            );
        }

        // Sadece liste sahibi güncelleyebilir
        const updated = await query(
            `UPDATE playlists
       SET title = $1,
           description = $2,
           is_public = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE playlist_id = $4 AND user_id = $5
       RETURNING playlist_id, title, description, is_public, updated_at`,
            [title.trim(), (description || '').trim(), is_public !== false, playlistId, user.user_id]
        );

        if (updated.rowCount === 0) {
            return NextResponse.json(
                { error: 'Playlist not found or you do not have permission to edit it.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ playlist: updated.rows[0] });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        console.error('Playlist PATCH error:', err);
        return NextResponse.json({ error: 'Failed to update playlist.' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;
        const playlistId = Number(id);

        // Admin herhangi bir listeyi, user ise sadece kendi listesini silebilir
        const deleted =
            user.role_name === 'admin'
                ? await query(`DELETE FROM playlists WHERE playlist_id = $1 RETURNING playlist_id`, [
                    playlistId,
                ])
                : await query(
                    `DELETE FROM playlists WHERE playlist_id = $1 AND user_id = $2 RETURNING playlist_id`,
                    [playlistId, user.user_id]
                );

        if (deleted.rowCount === 0) {
            return NextResponse.json(
                { error: 'Playlist not found or permission denied.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Playlist deleted successfully.' });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        console.error('Playlist DELETE error:', err);
        return NextResponse.json({ error: 'Failed to delete playlist.' }, { status: 500 });
    }
}