import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const sessionUser = await requireAuth();

        // profil bilgileri
        const result = await query(
            `SELECT
         u.user_id,
         u.username,
         u.email,
         u.bio,
         u.avatar_url,
         u.created_at,
         r.role_name,
         (SELECT COUNT(*)::int FROM media_reviews WHERE user_id = u.user_id) AS total_reviews,
         (SELECT ROUND(AVG(rating)::numeric, 1) FROM media_reviews WHERE user_id = u.user_id) AS avg_rating,
         (SELECT COUNT(*)::int FROM watchlists WHERE user_id = u.user_id) AS total_watchlists,
         (SELECT COUNT(*)::int FROM playlists WHERE user_id = u.user_id) AS total_playlists,
         (SELECT COUNT(*)::int FROM saved_videos WHERE user_id = u.user_id) AS total_saved_videos
       FROM users u
       INNER JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
            [sessionUser.user_id]
        );

        return NextResponse.json({ profile: result.rows[0] });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }
        console.error('Profile GET error:', err);
        return NextResponse.json({ error: 'Profil alınırken hata oluştu.' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const sessionUser = await requireAuth();
        const { username, bio, avatar_url } = await request.json();

        if (!username || username.trim().length < 3) {
            return NextResponse.json(
                { error: 'Kullanıcı adı en az 3 karakter olmalıdır.' },
                { status: 400 }
            );
        }

        const cleanUsername = username.trim();

        // Başka bir kullanıcı aynı username'i kullanıyor mu kontrol et
        const duplicate = await query(
            `SELECT user_id FROM users WHERE username = $1 AND user_id <> $2`,
            [cleanUsername, sessionUser.user_id]
        );

        if (duplicate.rowCount && duplicate.rowCount > 0) {
            return NextResponse.json(
                { error: 'Bu kullanıcı adı başka bir hesap tarafından kullanılıyor.' },
                { status: 409 }
            );
        }

        // Profil güncelleme
        const updated = await query(
            `UPDATE users
       SET username = $1,
           bio = $2,
           avatar_url = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING user_id, username, email, bio, avatar_url, updated_at`,
            [cleanUsername, bio ?? '', avatar_url || null, sessionUser.user_id]
        );

        return NextResponse.json({ profile: updated.rows[0] });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }
        console.error('Profile PATCH error:', err);
        return NextResponse.json({ error: 'Profil güncellenirken hata oluştu.' }, { status: 500 });
    }
}