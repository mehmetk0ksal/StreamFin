import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSessionToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'E-posta ve şifre zorunludur.' },
                { status: 400 }
            );
        }

        // Kullanıcı ve rol bilgisini tek sorguda getir
        const result = await query<{
            user_id: number;
            username: string;
            email: string;
            password_hash: string;
            is_active: boolean;
            role_name: 'admin' | 'user';
        }>(
            `SELECT u.user_id, u.username, u.email, u.password_hash, u.is_active, r.role_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = $1`,
            [email.trim().toLowerCase()]
        );

        const user = result.rows[0];
        if (!user || !user.is_active) {
            return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
        }

        const token = await createSessionToken({ userId: user.user_id, role: user.role_name });
        await setAuthCookie(token);

        return NextResponse.json({
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role_name: user.role_name,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json({ error: 'Giriş sırasında sunucu hatası oluştu.' }, { status: 500 });
    }
}