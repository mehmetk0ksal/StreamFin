'use client';

import { useEffect, useState } from 'react';

type TabKey = 'movies' | 'tv' | 'music' | 'videos';

interface ProfileData {
    user_id: number;
    username: string;
    email: string;
    bio: string;
    avatar_url: string | null;
    role_name: 'admin' | 'user';
    total_reviews: number;
    avg_rating: string | null;
    total_watchlists: number;
    total_playlists: number;
    total_saved_videos: number;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activity, setActivity] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('movies');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Profil düzenleme formu state'leri
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    async function fetchProfileAndActivity(queryText = '') {
        try {
            const [profRes, actRes] = await Promise.all([
                fetch('/api/profile'),
                fetch(`/api/profile/activity?q=${encodeURIComponent(queryText)}`),
            ]);

            if (profRes.status === 401) {
                setProfile(null);
                setLoading(false);
                return;
            }

            const profJson = await profRes.json();
            const actJson = await actRes.json();

            setProfile(profJson.profile);
            setUsername(profJson.profile.username);
            setBio(profJson.profile.bio || '');
            setAvatarUrl(profJson.profile.avatar_url || '');
            setActivity(actJson);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProfileAndActivity();
    }, []);

    async function handleProfileUpdate(e: React.FormEvent) {
        e.preventDefault();
        setStatusMsg('');

        const res = await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, bio, avatar_url: avatarUrl }),
        });

        const data = await res.json();
        if (!res.ok) {
            setStatusMsg(data.error || 'Güncelleme başarısız.');
            return;
        }

        setProfile((prev) => (prev ? { ...prev, ...data.profile } : prev));
        setStatusMsg('Profil başarıyla güncellendi.');
    }

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        await fetchProfileAndActivity(search);
    }

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!profile) {
        return (
            <div className="p-8 text-center">
                Bu sayfayı görüntülemek için giriş yapmalısınız.
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-5xl space-y-8 p-6">
            {/* Üst Profil Kartı ve İstatistikler */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{profile.username}</h1>
                            <span className="rounded-full bg-indigo-600/20 px-3 py-0.5 text-xs font-semibold uppercase text-indigo-300">
                                {profile.role_name}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-400">{profile.email}</p>
                        {profile.bio && <p className="mt-2 text-zinc-300">{profile.bio}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatBox label="İnceleme" value={profile.total_reviews} />
                        <StatBox label="Ort. Puan" value={profile.avg_rating ?? '-'} />
                        <StatBox label="Playlist" value={profile.total_playlists} />
                        <StatBox label="Video" value={profile.total_saved_videos} />
                    </div>
                </div>

                {/* Profil Düzenleme Formu */}
                <form onSubmit={handleProfileUpdate} className="mt-6 grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-3">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Kullanıcı adı"
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                    <input
                        type="text"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Kısa biyografi"
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="Avatar URL (opsiyonel)"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                        />
                        <button
                            type="submit"
                            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            Kaydet
                        </button>
                    </div>
                    {statusMsg && <p className="text-sm text-indigo-400 sm:col-span-3">{statusMsg}</p>}
                </form>
            </section>

            {/* Kategori Sekmeleri ve Arama */}
            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {(
                            [
                                ['movies', 'Filmler'],
                                ['tv', 'Diziler'],
                                ['music', 'Müzik'],
                                ['videos', 'Videolar'],
                            ] as [TabKey, string][]
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === key
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Kayıtlarımda ara..."
                            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
                        >
                            Filtrele
                        </button>
                    </form>
                </div>

                {/* Sekme İçerikleri */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100">
                    {activeTab === 'movies' && (
                        <div className="space-y-4">
                            <h2 className="font-semibold text-zinc-300">Film İncelemelerim</h2>
                            {activity?.movies?.reviews?.length ? (
                                activity.movies.reviews.map((r: any) => (
                                    <div key={r.review_id} className="rounded-lg bg-zinc-950 p-3">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{r.media_title}</span>
                                            <span className="text-amber-400">★ {r.rating}/10</span>
                                        </div>
                                        <p className="mt-1 text-sm text-zinc-400">{r.review_text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500">Henüz film incelemesi yok.</p>
                            )}

                            <h2 className="pt-2 font-semibold text-zinc-300">Film İzleme Listem</h2>
                            {activity?.movies?.watchlist?.length ? (
                                activity.movies.watchlist.map((w: any) => (
                                    <div key={w.watchlist_id} className="flex justify-between rounded-lg bg-zinc-950 p-3 text-sm">
                                        <span>{w.media_title}</span>
                                        <span className="text-zinc-400">{w.status}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500">Film izleme listesi boş.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'tv' && (
                        <div className="space-y-4">
                            <h2 className="font-semibold text-zinc-300">Dizi İncelemelerim</h2>
                            {activity?.tv?.reviews?.length ? (
                                activity.tv.reviews.map((r: any) => (
                                    <div key={r.review_id} className="rounded-lg bg-zinc-950 p-3">
                                        <div className="flex justify-between">
                                            <span className="font-medium">
                                                {r.media_title} ({r.media_type})
                                            </span>
                                            <span className="text-amber-400">★ {r.rating}/10</span>
                                        </div>
                                        <p className="mt-1 text-sm text-zinc-400">{r.review_text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500">Henüz dizi incelemesi yok.</p>
                            )}

                            <h2 className="pt-2 font-semibold text-zinc-300">Dizi İzleme Listem</h2>
                            {activity?.tv?.watchlist?.length ? (
                                activity.tv.watchlist.map((w: any) => (
                                    <div key={w.watchlist_id} className="flex justify-between rounded-lg bg-zinc-950 p-3 text-sm">
                                        <span>{w.media_title}</span>
                                        <span className="text-zinc-400">{w.status}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500">Dizi izleme listesi boş.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'music' && (
                        <div className="space-y-3">
                            <h2 className="font-semibold text-zinc-300">Çalma Listelerim</h2>
                            {activity?.music?.playlists?.length ? (
                                activity.music.playlists.map((p: any) => (
                                    <div key={p.playlist_id} className="flex justify-between rounded-lg bg-zinc-950 p-3">
                                        <div>
                                            <p className="font-medium">{p.title}</p>
                                            <p className="text-xs text-zinc-400">{p.description}</p>
                                        </div>
                                        <span className="text-sm text-zinc-400">{p.track_count} parça</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500">Henüz çalma listesi oluşturulmadı.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'videos' && (
                        <div className="space-y-3">
                            <h2 className="font-semibold text-zinc-300">Kaydettiğim Videolar</h2>
                            {activity?.videos?.saved?.length ? (
                                activity.videos.saved.map((v: any) => (
                                    <div key={v.saved_video_id} className="rounded-lg bg-zinc-950 p-3">
                                        <p className="font-medium">{v.video_title}</p>
                                        <p className="text-xs text-zinc-400">{v.channel_title}</p>
                                        {v.personal_note && <p className="mt-1 text-sm text-zinc-300">{v.personal_note}</p>}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500">Kaydedilmiş video yok.</p>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-zinc-950 px-4 py-2 text-center">
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-xs text-zinc-400">{label}</div>
        </div>
    );
}