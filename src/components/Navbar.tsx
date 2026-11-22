'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavUser {
    user_id: number;
    username: string;
    role_name: 'admin' | 'user';
}

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<NavUser | null>(null);

    useEffect(() => {
        let active = true;
        fetch('/api/auth/me')
            .then((res) => (res.ok ? res.json() : { user: null }))
            .then((data) => {
                if (active) setUser(data.user ?? null);
            })
            .catch(() => {
                if (active) setUser(null);
            });

        return () => {
            active = false;
        };
    }, [pathname]);

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
        router.refresh();
    }

    return (
        <header className="border-b border-zinc-800 bg-zinc-950 text-zinc-100">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-lg font-bold tracking-tight text-indigo-400">
                        StreamFin
                    </Link>
                    <nav className="hidden items-center gap-4 text-sm text-zinc-300 sm:flex">
                        <Link href="/movies" className="hover:text-white">Film &amp; Dizi</Link>
                        <Link href="/music" className="hover:text-white">Müzik</Link>
                        <Link href="/videos" className="hover:text-white">Videolar</Link>
                        {user?.role_name === 'admin' && (
                            <Link
                                href="/admin"
                                className="rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
                            >
                                Admin Paneli
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    {user ? (
                        <>
                            <Link href="/profile" className="font-medium text-zinc-200 hover:text-indigo-400">
                                {user.username}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                            >
                                Çıkış
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-zinc-300 hover:text-white">
                                Giriş Yap
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
                            >
                                Kayıt Ol
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}