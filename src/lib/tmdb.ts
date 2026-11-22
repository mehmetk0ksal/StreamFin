import 'server-only';
import { previewDetail, previewGenres, previewSeason, previewTitles } from './tmdb-preview';
import type {
  CatalogOptions, CatalogResult, CatalogSource, EpisodeDetail, Genre,
  MediaDetail, MediaItem, MediaType, SeasonDetail,
} from './tmdb-types';

export type * from './tmdb-types';

interface RawMedia {
  id: number;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  seasons?: { season_number: number; name: string; episode_count: number }[];
  credits?: { cast?: { name: string }[]; crew?: { name: string; job: string }[] };
  created_by?: { name: string }[];
}

interface RawEpisode {
  episode_number: number;
  name?: string;
  overview?: string;
  runtime?: number;
  air_date?: string;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
}

interface RawSeason {
  season_number: number;
  name?: string;
  overview?: string;
  episodes?: RawEpisode[];
}

interface RawPage {
  results: RawMedia[];
  total_pages: number;
}

const imageBase = 'https://image.tmdb.org/t/p/';
const types: MediaType[] = ['movie', 'tv'];

class TmdbRequestError extends Error {
  constructor(readonly status: number) {
    super('TMDB katalog bilgilerini gönderemedi. Biraz sonra tekrar deneyin.');
  }
}

export function catalogSource(): CatalogSource {
  return process.env.TMDB_READ_ACCESS_TOKEN?.trim() ? 'tmdb' : 'preview';
}

// TMDB credentials stay in the Authorization header, including for search.
async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.search = new URLSearchParams({ language: 'tr-TR', ...params }).toString();
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN!.trim()}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      ...(params.query ? { cache: 'no-store' as const } : { next: { revalidate: 3600 } }),
    });
  } catch {
    throw new Error('TMDB’ye ulaşılamadı. Biraz sonra tekrar deneyin.');
  }
  if (response.status === 404) return null;
  if (response.status === 401 || response.status === 403) {
    throw new Error('TMDB erişimi doğrulanamadı. Sunucudaki TMDB erişim belirtecini kontrol edin.');
  }
  if (response.status === 429) throw new Error('TMDB istek sınırına ulaşıldı. Biraz sonra tekrar deneyin.');
  if (!response.ok) throw new TmdbRequestError(response.status);
  return response.json() as Promise<T>;
}

function imageUrl(path: string | null | undefined, size: string) {
  return path ? `${imageBase}${size}${path}` : null;
}

function score(votes?: number, average?: number): number | null {
  return votes && average != null ? Math.round(average * 10) / 10 : null;
}

function normalize(row: RawMedia, type: MediaType, names: Genre[] = []): MediaItem {
  return {
    id: row.id, type,
    title: row.title || row.name || row.original_title || row.original_name || 'Adsız yapım',
    originalTitle: row.original_title || row.original_name || '',
    overview: row.overview || '',
    year: (row.release_date || row.first_air_date || '').slice(0, 4),
    posterPath: row.poster_path ?? null, posterUrl: imageUrl(row.poster_path, 'w500'),
    backdropUrl: imageUrl(row.backdrop_path, 'w1280'), rating: score(row.vote_count, row.vote_average),
    genres: (row.genres ?? names.filter(genre => row.genre_ids?.includes(genre.id))).map(genre => genre.name),
  };
}

export async function getGenres(type: MediaType | 'all' = 'all'): Promise<Genre[]> {
  if (catalogSource() === 'preview') {
    const titles = previewTitles.filter(row => type === 'all' || row.type === type);
    return previewGenres.filter(genre => titles.some(row => row.genres.includes(genre.id)));
  }
  const selected = type === 'all' ? types : [type];
  const results = await Promise.all(selected.map(t => tmdb<{ genres: Genre[] }>(`genre/${t}/list`)));
  const unique = new Map<number, Genre>();
  for (const result of results) {
    for (const genre of result?.genres ?? []) unique.set(genre.id, genre);
  }
  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

function searchText(text: string) {
  return text.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

async function readPage(path: string, params: Record<string, string>): Promise<RawPage | null> {
  try {
    return await tmdb<RawPage>(path, params);
  } catch (error) {
    // A combined movie/TV page may be beyond just one of the two lists.
    // Confirm its size so a rejected short list cannot hide the other results.
    if (Number(params.page) <= 1 || !(error instanceof TmdbRequestError)
      || (error.status !== 400 && error.status !== 422)) throw error;
    const first = await tmdb<RawPage>(path, { ...params, page: '1' });
    if (!first || Number(params.page) <= first.total_pages) throw error;
    return { results: [], total_pages: first.total_pages };
  }
}

export async function getCatalog(options: CatalogOptions = {}): Promise<CatalogResult> {
  const type = options.type ?? 'all';
  const query = options.query?.trim() || '';
  const genres = [...new Set(options.genres ?? [])];
  const requested = options.page ?? 1;
  const page = Number.isInteger(requested) ? Math.min(500, Math.max(1, requested)) : 1;
  const source = catalogSource();
  if (source === 'preview') {
    const needle = searchText(query);
    const titles = previewTitles.filter(title =>
      (type === 'all' || title.type === type)
      && genres.every(id => title.genres.includes(id))
      && [title.title, title.originalTitle, title.slug.replaceAll('-', ' ')].some(name => searchText(name).includes(needle))
    );
    return { source, items: page === 1 ? titles.map(previewDetail) : [], page, totalPages: 1 };
  }

  const mediaTypes = type === 'all' ? types : [type];
  const [genreNames, ...results] = await Promise.all([
    getGenres(type),
    ...mediaTypes.map(async mediaType => {
      const params: Record<string, string> = { page: String(page), include_adult: 'false' };
      if (query) params.query = query;
      else if (genres.length) params.with_genres = genres.join(',');
      const result = await readPage(`${query ? 'search' : 'discover'}/${mediaType}`, params);
      return { mediaType, result };
    }),
  ] as const);

  // TMDB search has no with_genres parameter. Keep its original page navigation
  // and apply the same AND rule to that page's title matches.
  const rows = results.flatMap(({ mediaType, result }) =>
    (result?.results ?? []).filter(row => genres.every(id => row.genre_ids?.includes(id)))
      .map((row, rank) => ({ row, mediaType, rank }))
  );
  rows.sort((a, b) => (query ? a.rank - b.rank : 0) || (b.row.popularity || 0) - (a.row.popularity || 0));
  return {
    source, items: rows.map(({ row, mediaType }) => normalize(row, mediaType, genreNames)), page,
    totalPages: Math.min(500, Math.max(1, ...results.map(({ result }) => result?.total_pages ?? 0))),
  };
}

export async function getMediaDetail(type: MediaType, id: number): Promise<MediaDetail | null> {
  if (!types.includes(type) || !Number.isSafeInteger(id) || id < 1) return null;
  if (catalogSource() === 'preview') {
    const title = previewTitles.find(row => row.type === type && row.id === id);
    return title ? previewDetail(title) : null;
  }
  const row = await tmdb<RawMedia>(`${type}/${id}`, { append_to_response: 'credits' });
  if (!row) return null;
  const creators = type === 'movie' ? row.credits?.crew?.filter(person => person.job === 'Director') : row.created_by;
  return {
    ...normalize(row, type), runtime: row.runtime || row.episode_run_time?.[0] || null,
    releaseDate: row.release_date || row.first_air_date || null,
    cast: (row.credits?.cast ?? []).slice(0, 8).map(person => person.name),
    creators: (creators ?? []).map(person => person.name),
    seasons: (row.seasons ?? []).map(season => ({
      number: season.season_number, name: season.name, episodeCount: season.episode_count,
    })),
  };
}

function episodeDetail(row: RawEpisode): EpisodeDetail {
  return {
    number: row.episode_number, name: row.name || `${row.episode_number}. Bölüm`,
    overview: row.overview || '', runtime: row.runtime || null, airDate: row.air_date || null,
    stillUrl: imageUrl(row.still_path, 'original'), rating: score(row.vote_count, row.vote_average),
  };
}

export async function getSeason(seriesId: number, seasonNumber: number): Promise<SeasonDetail | null> {
  if (!Number.isSafeInteger(seriesId) || seriesId < 1 || !Number.isSafeInteger(seasonNumber) || seasonNumber < 0) return null;
  if (catalogSource() === 'preview') return previewSeason(seriesId, seasonNumber);
  const row = await tmdb<RawSeason>(`tv/${seriesId}/season/${seasonNumber}`);
  if (!row) return null;
  return {
    number: row.season_number, name: row.name || `${seasonNumber}. Sezon`,
    overview: row.overview || '', episodes: (row.episodes ?? []).map(episodeDetail),
  };
}

export async function getEpisode(seriesId: number, seasonNumber: number, episodeNumber: number): Promise<EpisodeDetail | null> {
  if (!Number.isSafeInteger(episodeNumber) || episodeNumber < 1) return null;
  if (!Number.isSafeInteger(seriesId) || seriesId < 1 || !Number.isSafeInteger(seasonNumber) || seasonNumber < 0) return null;
  if (catalogSource() === 'preview') {
    return previewSeason(seriesId, seasonNumber)?.episodes.find(episode => episode.number === episodeNumber) ?? null;
  }
  const row = await tmdb<RawEpisode>(`tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`);
  return row ? episodeDetail(row) : null;
}
