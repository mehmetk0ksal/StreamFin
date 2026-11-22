import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSessionToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, email, password } = await request.json();

        if (!username || !email || !password || password.length < 6) {
            return NextResponse.json(
                { error: 'Kullanıcı adı, e-posta ve en az 6 karakterli şifre zorunludur.' },
                { status: 400 }
            );
        }

        // e-posta veya kullanıcı adı daha önce alınmış mı kontrol et
        const existing = await query(
            `SELECT user_id FROM users WHERE email = $1 OR username = $2`,
            [email.trim().toLowerCase(), username.trim()]
        );

        if (existing.rowCount && existing.rowCount > 0) {
            return NextResponse.json(
                { error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor.' },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // kullanıcıyı "user" rolüyle ekle
        const inserted = await query<{
            user_id: number;
            username: string;
            email: string;
        }>(
            `INSERT INTO users (role_id, username, email, password_hash)
       VALUES (
         (SELECT role_id FROM roles WHERE role_name = 'user'),
         $1, $2, $3
       )
       RETURNING user_id, username, email`,
            [username.trim(), email.trim().toLowerCase(), passwordHash]
        );

        const newUser = inserted.rows[0];
        const token = await createSessionToken({ userId: newUser.user_id, role: 'user' });
        await setAuthCookie(token);

        return NextResponse.json(
            { user: { ...newUser, role_name: 'user' } },
            { status: 201 }
        );
    } catch (err) {
        console.error('Register error:', err);
        return NextResponse.json({ error: 'Kayıt sırasında sunucu hatası oluştu.' }, { status: 500 });
    }
}