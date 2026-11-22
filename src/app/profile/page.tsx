'use client';

import { useState } from 'react';
import Link from 'next/link';
import { detailHref, useLibraryData } from '@/components/LibraryControls';
import { STATUS_LABELS, type Review, type WatchlistEntry } from '@/lib/library-types';

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

type ActivityReview = Pick<Review, 'review_id' | 'tmdb_id' | 'media_title' | 'rating' | 'review_text' | 'is_hidden' | 'created_at'>;
type TvReview = ActivityReview & Pick<Review, 'media_type' | 'season_number' | 'episode_number'>;
type ActivityWatch = Pick<WatchlistEntry, 'watchlist_id' | 'tmdb_id' | 'media_title' | 'status' | 'poster_path' | 'updated_at'>;

interface ProfileActivity {
    movies: { reviews: ActivityReview[]; watchlist: ActivityWatch[] };
    tv: { reviews: TvReview[]; watchlist: ActivityWatch[] };
    music: { playlists: { playlist_id: number; title: string; description: string | null; track_count: number }[] };
    videos: { saved: { saved_video_id: number; video_title: string; channel_title: string; personal_note: string | null }[] };
}

export default function ProfilePage() {
    const [revision, setRevision] = useState(0);
    const result = useLibraryData<{ profile?: ProfileData }>('/api/profile', revision);
    if (result.status === 'loading') return <p role="status" className="p-8 text-center">Profilin yükleniyor…</p>;
    if (result.status === 'error' && result.unauthorized) {
        return <p className="p-8 text-center">Profilini görüntülemek için <Link className="text-cyan-300 underline" href="/login">giriş yap</Link>.</p>;
    }
    if (result.status === 'error' || !result.data.profile) {
        return <div className="space-y-2 p-8 text-center"><p role="alert">{result.status === 'error' ? result.message : 'Profil bulunamadı.'}</p>
            <button className="text-cyan-300 underline" onClick={() => setRevision((v) => v + 1)}>Tekrar dene</button>
        </div>;
    }
    return <ProfileContent initial={result.data.profile} />;
}

function ProfileContent({ initial }: { initial: ProfileData }) {
    const [profile, setProfile] = useState(initial);
    const [activeTab, setActiveTab] = useState<TabKey>('movies');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [revision, setRevision] = useState(0);
    const activityResult = useLibraryData<ProfileActivity>(`/api/profile/activity?q=${encodeURIComponent(query)}`, revision);
    const activity = activityResult.status === 'ready' ? activityResult.data : null;
    const [username, setUsername] = useState(initial.username);
    const [bio, setBio] = useState(initial.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url || '');
    const [statusMsg, setStatusMsg] = useState('');

    async function handleProfileUpdate(e: React.FormEvent) {
        e.preventDefault();
        setStatusMsg('');

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, bio, avatar_url: avatarUrl }),
            });
            const data = await res.json();
            if (!res.ok || !data.profile) {
                setStatusMsg(data.error || 'Güncelleme başarısız.');
                return;
            }
            setProfile((prev) => ({ ...prev, ...data.profile }));
            setStatusMsg('Profil başarıyla güncellendi.');
        } catch {
            setStatusMsg('Sunucuya ulaşılamadı. Lütfen tekrar deneyin.');
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setQuery(search.trim());
        setRevision((v) => v + 1);
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
                    {activityResult.status === 'loading' && <p role="status" className="text-sm text-zinc-400">Etkinliklerin yükleniyor…</p>}
                    {activityResult.status === 'error' && <div className="space-y-2">
                        <p role="alert" className="text-sm">{activityResult.message}</p>
                        <button className="text-sm text-cyan-300 underline" onClick={() => setRevision((v) => v + 1)}>Tekrar dene</button>
                    </div>}
                    {activity && (activeTab === 'movies' || activeTab === 'tv') && (
                        <ProfileMediaActivity type={activeTab === 'movies' ? 'movie' : 'tv'} items={activity[activeTab]} />
                    )}

                    {activity && activeTab === 'music' && (
                        <div className="space-y-3">
                            <h2 className="font-semibold text-zinc-300">Çalma Listelerim</h2>
                            {activity?.music?.playlists?.length ? (
                                activity.music.playlists.map((p) => (
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

                    {activity && activeTab === 'videos' && (
                        <div className="space-y-3">
                            <h2 className="font-semibold text-zinc-300">Kaydettiğim Videolar</h2>
                            {activity?.videos?.saved?.length ? (
                                activity.videos.saved.map((v) => (
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

function ProfileMediaActivity({ type, items }: {
    type: 'movie' | 'tv';
    items: { reviews: (ActivityReview & Partial<Pick<TvReview, 'media_type' | 'season_number' | 'episode_number'>>)[]; watchlist: ActivityWatch[] };
}) {
    const label = type === 'movie' ? 'Film' : 'Dizi';
    const manage = 'text-sm text-cyan-300 hover:underline';
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-zinc-300">{label} İncelemelerim</h2>
                <Link className={manage} href={`/movies/library?type=${type}&tab=reviews`}>İncelemelerimi yönet</Link>
            </div>
            {items.reviews.length ? items.reviews.map((r) => {
                const context = [
                    r.season_number != null ? `${r.season_number}. sezon` : '',
                    r.episode_number != null ? `${r.episode_number}. bölüm` : '',
                ].filter(Boolean).join(' · ');
                return (
                    <div key={r.review_id} className="rounded-lg bg-zinc-950 p-3">
                        <div className="flex items-baseline justify-between gap-2">
                            <Link className="font-medium hover:text-cyan-300" href={detailHref(r.media_type ?? type, r.tmdb_id, r.season_number, r.episode_number)}>
                                {r.media_title}{context && <span className="ml-2 text-sm text-zinc-400">{context}</span>}
                            </Link>
                            <span className="shrink-0 text-amber-400">★ {r.rating}/10</span>
                        </div>
                        {r.review_text && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-400">{r.review_text}</p>}
                        {r.is_hidden && <p className="mt-1 text-xs text-zinc-400">Moderasyon nedeniyle gizlendi.</p>}
                    </div>
                );
            }) : <p className="text-sm text-zinc-400">Gösterilecek inceleme yok.</p>}
            <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2">
                <h2 className="font-semibold text-zinc-300">{label} İzleme Listem</h2>
                <Link className={manage} href={`/movies/library?type=${type}&tab=watchlist`}>İzleme listemi yönet</Link>
            </div>
            {items.watchlist.length ? items.watchlist.map((w) => (
                <div key={w.watchlist_id} className="flex justify-between gap-2 rounded-lg bg-zinc-950 p-3 text-sm">
                    <Link className="hover:text-cyan-300" href={detailHref(type, w.tmdb_id)}>{w.media_title}</Link>
                    <span className="shrink-0 text-zinc-400">{STATUS_LABELS[w.status]}</span>
                </div>
            )) : <p className="text-sm text-zinc-400">Gösterilecek izleme kaydı yok.</p>}
        </div>
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
