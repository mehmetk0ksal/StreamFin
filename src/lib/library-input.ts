import { REVIEW_TEXT_MAX_LENGTH, STATUS_LABELS, type ReviewType, type WatchStatus } from './library-types';

export class LibraryError extends Error {
    constructor(message: string, readonly status = 400) {
        super(message);
    }
}

export function libraryErrorResponse(error: unknown) {
    if (error instanceof LibraryError) {
        return Response.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return Response.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
    }
    console.error('Film ve dizi kaydı işlenemedi.', error instanceof Error ? error.name : 'Error');
    return Response.json({ error: 'Veritabanına şu anda erişilemiyor. Lütfen tekrar deneyin.' }, { status: 503 });
}

export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new LibraryError('Geçerli bir JSON nesnesi gönderin.');
    }
    return body;
}

export function integer(value: unknown, label: string, minimum = 1, maximum = 2147483647): number {
    const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (typeof number !== 'number' || !Number.isInteger(number) || number < minimum || number > maximum) {
        throw new LibraryError(`${label} geçersiz.`);
    }
    return number;
}

export function reviewType(value: unknown): ReviewType {
    if (value === 'movie' || value === 'tv' || value === 'season' || value === 'episode') return value;
    throw new LibraryError('Geçerli bir içerik türü seçin.');
}

export function watchType(value: unknown): 'movie' | 'tv' {
    if (value === 'movie' || value === 'tv') return value;
    throw new LibraryError('İzleme listesine film veya dizi eklenebilir.');
}

export function watchStatus(value: unknown): WatchStatus {
    if (typeof value === 'string' && Object.hasOwn(STATUS_LABELS, value)) return value as WatchStatus;
    throw new LibraryError('Geçerli bir izleme durumu seçin.');
}

export function reviewCoordinates(type: ReviewType, season: unknown, episode: unknown) {
    const usesSeason = type === 'season' || type === 'episode';
    const usesEpisode = type === 'episode';
    if ((!usesSeason && season != null) || (!usesEpisode && episode != null)) {
        throw new LibraryError('Sezon veya bölüm numarası içerik türüyle uyuşmuyor.');
    }
    return {
        season: usesSeason ? integer(season, 'Sezon numarası', 0) : null,
        episode: usesEpisode ? integer(episode, 'Bölüm numarası', 0) : null,
    };
}

export function mediaTitle(value: unknown) {
    if (typeof value !== 'string' || !value.trim() || value.includes('\0') || Array.from(value.trim()).length > 255) {
        throw new LibraryError('İçerik başlığı 1 ile 255 karakter arasında olmalıdır.');
    }
    return value.trim();
}

export function reviewText(value: unknown) {
    if (value == null) return null;
    if (typeof value !== 'string' || value.includes('\0') || value.length > REVIEW_TEXT_MAX_LENGTH) {
        throw new LibraryError(`İnceleme metni en fazla ${REVIEW_TEXT_MAX_LENGTH} karakter olabilir.`);
    }
    return value.trim() || null;
}

export function posterPath(value: unknown) {
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || !/^\/(?:catalog\/)?[\w-]+\.(?:jpg|jpeg|png|webp)$/i.test(value)) {
        throw new LibraryError('Afiş yolu geçersiz.');
    }
    return value;
}

export function searchPattern(value: string | null) {
    const search = (value ?? '').trim();
    if (!search) return null;
    if (search.includes('\0')) throw new LibraryError('Arama metni geçersiz.');
    return `%${search.replace(/[\\%_]/g, '\\$&')}%`;
}

export function requireRecord<T>(record: T | undefined): T {
    if (!record) throw new LibraryError('Kayıt bulunamadı.', 404);
    return record;
}
