export interface AudiusTrack {
    id: string;
    title: string;
    artist: string;
    artwork: string | null;
    duration: number;
    streamUrl: string;
}

const APP_NAME = 'StreamFin';
let cachedHost: string | null = null;
let cachedAt = 0;

/**
 * bir audius sunucusu seçer ve 10 dakika önbellekte tutar
 */
async function getAudiusHost(): Promise<string> {
    const now = Date.now();
    if (cachedHost && now - cachedAt < 10 * 60 * 1000) {
        return cachedHost;
    }

    try {
        const res = await fetch('https://api.audius.co', { cache: 'no-store' });
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
            cachedHost = json.data[0];
            cachedAt = now;
            return cachedHost!;
        }
    } catch (err) {
        console.error('Audius host discovery failed, using fallback:', err);
    }

    return 'https://discoveryprovider.audius.co';
}

function normalizeTrack(raw: any, host: string): AudiusTrack {
    return {
        id: String(raw.id),
        title: raw.title || 'Untitled Track',
        artist: raw.user?.name || raw.user?.handle || 'Unknown Artist',
        artwork: raw.artwork?.['480x480'] || raw.artwork?.['150x150'] || null,
        duration: Number(raw.duration) || 0,
        streamUrl: `${host}/v1/tracks/${encodeURIComponent(raw.id)}/stream?app_name=${APP_NAME}`,
    };
}

export async function searchAudiusTracks(searchQuery: string): Promise<AudiusTrack[]> {
    const host = await getAudiusHost();
    const url = `${host}/v1/tracks/search?query=${encodeURIComponent(searchQuery)}&app_name=${APP_NAME}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Audius search request failed');

    const json = await res.json();
    const tracks = Array.isArray(json.data) ? json.data : [];
    // Sadece stream edilebilir parçaları filtrele
    return tracks
        .filter((t: any) => t.is_streamable !== false)
        .slice(0, 20)
        .map((t: any) => normalizeTrack(t, host));
}

export async function getTrendingAudiusTracks(): Promise<AudiusTrack[]> {
    const host = await getAudiusHost();
    const url = `${host}/v1/tracks/trending?app_name=${APP_NAME}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Audius trending request failed');

    const json = await res.json();
    const tracks = Array.isArray(json.data) ? json.data : [];
    return tracks
        .filter((t: any) => t.is_streamable !== false)
        .slice(0, 20)
        .map((t: any) => normalizeTrack(t, host));
}