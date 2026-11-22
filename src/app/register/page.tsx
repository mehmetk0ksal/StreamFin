'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { movieReturnPath } from '@/lib/auth-return';
import Link from 'next/link';

export default function RegisterPage() {
    return <Suspense><RegisterForm /></Suspense>;
}

function RegisterForm() {
    const next = movieReturnPath(useSearchParams().get('next'));
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (username.trim().length < 3) {
            setError('Kullanıcı adı en az 3 karakter olmalıdır.');
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler birbiriyle eşleşmiyor.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Kayıt işlemi başarısız.');
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
                <h1 className="text-2xl font-bold">Hesap Oluştur</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Film, dizi, müzik ve video listelerini tek yerden yönet.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="mb-1 block text-sm font-medium text-zinc-300">
                            Kullanıcı Adı
                        </label>
                        <input
                            id="username"
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="mehmet_k"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

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
                            placeholder="En az 6 karakter"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-zinc-300">
                            Şifre Tekrar
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Şifreni tekrar gir"
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
                        {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-400">
                    Zaten hesabın var mı?{' '}
                    <Link href={next === '/profile' ? '/login' : '/login?next=' + encodeURIComponent(next)} className="font-medium text-indigo-400 hover:underline">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </main>
    );
}
