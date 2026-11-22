'use client';

import { useEffect, useState } from 'react';

interface AudiusTrack {
    id: string;
    title: string;
    artist: string;
    artwork: string | null;
    duration: number;
    streamUrl: string;
}

interface PlaylistSummary {
    playlist_id: number;
    title: string;
    description: string;
    is_public: boolean;
    track_count: number;
}

interface PlaylistTrack {
    playlist_track_id: number;
    playlist_id: number;
    audius_track_id: string;
    track_title: string;
    artist_name: string;
    artwork_url: string | null;
    duration_seconds: number;
    track_order: number;
}

function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function MusicPage() {
    // Audius arama ve oynatıcı state'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [tracks, setTracks] = useState<AudiusTrack[]>([]);
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [nowPlaying, setNowPlaying] = useState<{
        title: string;
        artist: string;
        streamUrl: string;
    } | null>(null);

    // Çalma listesi state'leri
    const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
    const [feedback, setFeedback] = useState('');

    // Yeni liste / düzenleme formu state'leri
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    async function fetchTracks(q = '') {
        setLoadingTracks(true);
        try {
            const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setTracks(data.tracks || []);
        } finally {
            setLoadingTracks(false);
        }
    }

    async function fetchPlaylists() {
        const res = await fetch('/api/playlists');
        if (!res.ok) return;
        const data = await res.json();
        setPlaylists(data.playlists || []);
    }

    async function fetchPlaylistDetail(playlistId: number) {
        const res = await fetch(`/api/playlists/${playlistId}`);
        if (!res.ok) return;
        const data = await res.json();
        setPlaylistTracks(data.tracks || []);
    }

    useEffect(() => {
        fetchTracks();
        fetchPlaylists();
    }, []);

    useEffect(() => {
        if (selectedPlaylistId) {
            fetchPlaylistDetail(selectedPlaylistId);
        } else {
            setPlaylistTracks([]);
        }
    }, [selectedPlaylistId]);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        await fetchTracks(searchQuery);
    }

    async function handleCreatePlaylist(e: React.FormEvent) {
        e.preventDefault();
        setFeedback('');
        const res = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle, description: newDesc, is_public: true }),
        });
        const data = await res.json();
        if (!res.ok) {
            setFeedback(data.error || 'Could not create playlist.');
            return;
        }
        setNewTitle('');
        setNewDesc('');
        await fetchPlaylists();
        setSelectedPlaylistId(data.playlist.playlist_id);
        setFeedback('Playlist created.');
    }

    async function handleUpdatePlaylist(e: React.FormEvent) {
        e.preventDefault();
        if (!editingId) return;
        setFeedback('');
        const res = await fetch(`/api/playlists/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editTitle, description: editDesc, is_public: true }),
        });
        const data = await res.json();
        if (!res.ok) {
            setFeedback(data.error || 'Update failed.');
            return;
        }
        setEditingId(null);
        await fetchPlaylists();
        setFeedback('Playlist updated.');
    }

    async function handleDeletePlaylist(playlistId: number) {
        setFeedback('');
        const res = await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json();
            setFeedback(data.error || 'Delete failed.');
            return;
        }
        if (selectedPlaylistId === playlistId) {
            setSelectedPlaylistId(null);
        }
        await fetchPlaylists();
        setFeedback('Playlist deleted.');
    }

    async function handleAddTrack(track: AudiusTrack) {
        if (!selectedPlaylistId) {
            setFeedback('Please select a playlist first.');
            return;
        }
        setFeedback('');
        const res = await fetch(`/api/playlists/${selectedPlaylistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audius_track_id: track.id,
                track_title: track.title,
                artist_name: track.artist,
                artwork_url: track.artwork,
                duration_seconds: track.duration,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setFeedback(data.error || 'Could not add track.');
            return;
        }
        await Promise.all([fetchPlaylistDetail(selectedPlaylistId), fetchPlaylists()]);
        setFeedback(`Added "${track.title}" to playlist.`);
    }

    async function handleRemoveTrack(playlistTrackId: number) {
        if (!selectedPlaylistId) return;
        const res = await fetch(
            `/api/playlists/${selectedPlaylistId}/tracks/${playlistTrackId}`,
            { method: 'DELETE' }
        );
        if (res.ok) {
            await Promise.all([fetchPlaylistDetail(selectedPlaylistId), fetchPlaylists()]);
        }
    }

    async function handleMoveTrack(index: number, direction: -1 | 1) {
        if (!selectedPlaylistId) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= playlistTracks.length) return;

        const reordered = [...playlistTracks];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);
        setPlaylistTracks(reordered);

        await fetch(`/api/playlists/${selectedPlaylistId}/tracks/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderedTrackIds: reordered.map((t) => t.playlist_track_id),
            }),
        });
        await fetchPlaylistDetail(selectedPlaylistId);
    }

    const selectedPlaylist = playlists.find((p) => p.playlist_id === selectedPlaylistId) || null;

    return (
        <main className="mx-auto max-w-6xl space-y-6 p-6 pb-28">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Music &amp; Playlists</h1>
                    <p className="text-sm text-zinc-400">
                        Discover and stream tracks via Audius, and organize your personal playlists.
                    </p>
                </div>
                {feedback && (
                    <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300">
                        {feedback}
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Sol Kolon: Audius Arama & Parçalar */}
                <section className="space-y-4 lg:col-span-7">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tracks or artists on Audius..."
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            Search
                        </button>
                    </form>

                    <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                            {searchQuery ? `Results for "${searchQuery}"` : 'Trending on Audius'}
                        </h2>

                        {loadingTracks ? (
                            <p className="py-6 text-center text-sm text-zinc-500">Loading tracks...</p>
                        ) : tracks.length === 0 ? (
                            <p className="py-6 text-center text-sm text-zinc-500">No tracks found.</p>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {tracks.map((track) => (
                                    <div
                                        key={track.id}
                                        className="flex items-center justify-between gap-3 py-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            {track.artwork ? (
                                                <img
                                                    src={track.artwork}
                                                    alt={track.title}
                                                    className="h-11 w-11 shrink-0 rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs text-zinc-400">
                                                    ♪
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-zinc-100">{track.title}</p>
                                                <p className="truncate text-xs text-zinc-400">
                                                    {track.artist} • {formatDuration(track.duration)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setNowPlaying({
                                                        title: track.title,
                                                        artist: track.artist,
                                                        streamUrl: track.streamUrl,
                                                    })
                                                }
                                                className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                                            >
                                                Play
                                            </button>
                                            <button
                                                onClick={() => handleAddTrack(track)}
                                                className="rounded-md bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/35"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Sağ Kolon: Çalma Listeleri ve Parça Sıralama */}
                <section className="space-y-4 lg:col-span-5">
                    {/* Yeni Çalma Listesi Formu */}
                    <form
                        onSubmit={handleCreatePlaylist}
                        className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                            Create Playlist
                        </h2>
                        <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Playlist title"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                        />
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                            />
                            <button
                                type="submit"
                                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                            >
                                Create
                            </button>
                        </div>
                    </form>

                    {/* Çalma Listelerim */}
                    <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                            My Playlists
                        </h2>
                        {playlists.length === 0 ? (
                            <p className="text-sm text-zinc-500">
                                No playlists yet. Create one above to start adding tracks.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {playlists.map((pl) => (
                                    <div
                                        key={pl.playlist_id}
                                        className={`rounded-lg border p-3 transition ${selectedPlaylistId === pl.playlist_id
                                                ? 'border-indigo-500 bg-indigo-950/30'
                                                : 'border-zinc-800 bg-zinc-950'
                                            }`}
                                    >
                                        {editingId === pl.playlist_id ? (
                                            <form onSubmit={handleUpdatePlaylist} className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
                                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        type="submit"
                                                        className="rounded bg-indigo-600 px-2.5 py-1 text-xs text-white"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingId(null)}
                                                        className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="flex items-center justify-between gap-2">
                                                <button
                                                    onClick={() => setSelectedPlaylistId(pl.playlist_id)}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <p className="truncate font-medium text-zinc-100">{pl.title}</p>
                                                    <p className="truncate text-xs text-zinc-400">
                                                        {pl.track_count} tracks
                                                        {pl.description ? ` • ${pl.description}` : ''}
                                                    </p>
                                                </button>
                                                <div className="flex shrink-0 gap-1.5">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(pl.playlist_id);
                                                            setEditTitle(pl.title);
                                                            setEditDesc(pl.description || '');
                                                        }}
                                                        className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePlaylist(pl.playlist_id)}
                                                        className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-400 hover:bg-red-500/25"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Seçili Çalma Listesinin Parçaları ve Sıralama */}
                    {selectedPlaylist && (
                        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <h2 className="text-sm font-semibold text-zinc-200">
                                Tracks in &ldquo;{selectedPlaylist.title}&rdquo;
                            </h2>
                            {playlistTracks.length === 0 ? (
                                <p className="text-sm text-zinc-500">
                                    Use &ldquo;+ Add&rdquo; on any track to add it here.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {playlistTracks.map((t, index) => (
                                        <div
                                            key={t.playlist_track_id}
                                            className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950 p-2.5 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-zinc-100">
                                                    {t.track_order}. {t.track_title}
                                                </p>
                                                <p className="truncate text-xs text-zinc-400">{t.artist_name}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        setNowPlaying({
                                                            title: t.track_title,
                                                            artist: t.artist_name,
                                                            streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${encodeURIComponent(
                                                                t.audius_track_id
                                                            )}/stream?app_name=StreamFin`,
                                                        })
                                                    }
                                                    className="rounded bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
                                                >
                                                    ▶
                                                </button>
                                                <button
                                                    disabled={index === 0}
                                                    onClick={() => handleMoveTrack(index, -1)}
                                                    className="rounded bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700 disabled:opacity-30"
                                                    title="Move Up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    disabled={index === playlistTracks.length - 1}
                                                    onClick={() => handleMoveTrack(index, 1)}
                                                    className="rounded bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700 disabled:opacity-30"
                                                    title="Move Down"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveTrack(t.playlist_track_id)}
                                                    className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-400 hover:bg-red-500/25"
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Alt Sabit Oynatıcı */}
            {nowPlaying && (
                <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 px-6 py-3 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{nowPlaying.title}</p>
                            <p className="truncate text-xs text-zinc-400">{nowPlaying.artist}</p>
                        </div>
                        <audio
                            key={nowPlaying.streamUrl}
                            src={nowPlaying.streamUrl}
                            controls
                            autoPlay
                            className="h-9 w-full max-w-md"
                        />
                    </div>
                </div>
            )}
        </main>
    );
}