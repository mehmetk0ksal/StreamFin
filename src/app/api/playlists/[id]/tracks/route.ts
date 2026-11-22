import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;
        const playlistId = Number(id);
        const { audius_track_id, track_title, artist_name, artwork_url, duration_seconds } =
            await request.json();

        if (!audius_track_id || !track_title || !artist_name) {
            return NextResponse.json({ error: 'Missing required track fields.' }, { status: 400 });
        }

        // Sahiplik kontrolü
        const ownerCheck = await query(
            `SELECT playlist_id FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
            [playlistId, user.user_id]
        );
        if (ownerCheck.rowCount === 0) {
            return NextResponse.json({ error: 'Playlist not found or access denied.' }, { status: 403 });
        }

        // Bir sonraki sıra numarasını (track_order) SQL ile hesaplayıp ekle
        const inserted = await query(
            `INSERT INTO playlist_tracks (
         playlist_id, audius_track_id, track_title, artist_name,
         artwork_url, duration_seconds, track_order
       )
       VALUES (
         $1, $2, $3, $4, $5, $6,
         (SELECT COALESCE(MAX(track_order), 0) + 1 FROM playlist_tracks WHERE playlist_id = $1)
       )
       RETURNING *`,
            [
                playlistId,
                String(audius_track_id),
                track_title,
                artist_name,
                artwork_url || null,
                Number(duration_seconds) || 0,
            ]
        );

        // Çalma listesinin updated_at tarihini güncelle
        await query(`UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE playlist_id = $1`, [
            playlistId,
        ]);

        return NextResponse.json({ track: inserted.rows[0] }, { status: 201 });
    } catch (err: any) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        // aynı parça aynı listede zaten varsa
        if (err?.code === '23505') {
            return NextResponse.json(
                { error: 'This track is already in the selected playlist.' },
                { status: 409 }
            );
        }
        console.error('Add track error:', err);
        return NextResponse.json({ error: 'Failed to add track to playlist.' }, { status: 500 });
    }
}