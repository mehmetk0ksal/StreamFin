import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from './db';

const COOKIE_NAME = 'streamfin_session';
function signingKey() {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET tanımlanmalı.');
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

export interface SessionUser {
    user_id: number;
    username: string;
    email: string;
    role_name: 'admin' | 'user';
    bio: string;
    avatar_url: string | null;
}

export async function createSessionToken(payload: {
    userId: number;
    role: 'admin' | 'user';
}): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(signingKey());
}

export async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 gün
    });
}

export async function clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, signingKey(), { algorithms: ['HS256'] });
        const userId = Number(payload.userId);
        if (!userId) return null;

        // Kullanıcıyı ve rolünü doğrula
        const result = await query<SessionUser>(
            `SELECT u.user_id, u.username, u.email, r.role_name, u.bio, u.avatar_url
       FROM users u
       INNER JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1 AND u.is_active = TRUE`,
            [userId]
        );

        return result.rows[0] ?? null;
    } catch {
        return null;
    }
}

/**
 * Sadece giriş yapmış kullanıcıların erişebileceği rol koruması
 */
export async function requireAuth(): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('UNAUTHORIZED');
    }
    return user;
}

/**
 * Sadece admin rolündeki kullanıcıların erişebileceği rol koruması
 */
export async function requireAdmin(): Promise<SessionUser> {
    const user = await requireAuth();
    if (user.role_name !== 'admin') {
        throw new Error('FORBIDDEN');
    }
    return user;
}
