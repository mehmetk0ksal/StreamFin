'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { movieReturnPath } from '@/lib/auth-return';
import Link from 'next/link';

export default function LoginPage() {
    return <Suspense><LoginForm /></Suspense>;
}

function LoginForm() {
    const next = movieReturnPath(useSearchParams().get('next'));
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Giriş yapılamadı.');
                return;
            }

            router.push(next);
            router.refresh();
        } catch {
            setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-100 shadow-lg">
                <h1 className="text-2xl font-bold">StreamFin&apos;e Giriş Yap</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    İncelemelerine, listelerine ve çalma listelerine eriş.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-300">
                            E-posta
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@mail.com"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-300">
                            Şifre
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-400">
                    Hesabın yok mu?{' '}
                    <Link href={next === '/profile' ? '/register' : '/register?next=' + encodeURIComponent(next)} className="font-medium text-indigo-400 hover:underline">
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </main>
    );
}
