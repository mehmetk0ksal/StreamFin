import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const user = await requireAuth();

        // Kullanıcının çalma listeleri ve parça sayıları
        const result = await query(
            `SELECT p.playlist_id, p.title, p.description, p.is_public, p.created_at, p.updated_at,
              COUNT(pt.playlist_track_id)::int AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
       WHERE p.user_id = $1
       GROUP BY p.playlist_id
       ORDER BY p.updated_at DESC`,
            [user.user_id]
        );

        return NextResponse.json({ playlists: result.rows });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        console.error('Playlists GET error:', err);
        return NextResponse.json({ error: 'Failed to load playlists.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const { title, description, is_public } = await request.json();

        if (!title || title.trim().length < 2) {
            return NextResponse.json(
                { error: 'Playlist title must be at least 2 characters.' },
                { status: 400 }
            );
        }

        // Yeni çalma listesi ekle
        const inserted = await query(
            `INSERT INTO playlists (user_id, title, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING playlist_id, title, description, is_public, created_at, updated_at`,
            [user.user_id, title.trim(), (description || '').trim(), is_public !== false]
        );

        return NextResponse.json(
            { playlist: { ...inserted.rows[0], track_count: 0 } },
            { status: 201 }
        );
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }
        console.error('Playlists POST error:', err);
        return NextResponse.json({ error: 'Failed to create playlist.' }, { status: 500 });
    }
}