export type MediaType = 'movie' | 'tv';
export type CatalogSource = 'tmdb' | 'preview';

export interface Genre {
  id: number;
  name: string;
}

export interface MediaItem {
  id: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  year: string;
  posterPath: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number | null;
  genres: string[];
}

export interface SeasonSummary {
  number: number;
  name: string;
  episodeCount: number;
}

export interface MediaDetail extends MediaItem {
  runtime: number | null;
  releaseDate: string | null;
  cast: string[];
  creators: string[];
  seasons: SeasonSummary[];
}

export interface EpisodeDetail {
  number: number;
  name: string;
  overview: string;
  runtime: number | null;
  airDate: string | null;
  stillUrl: string | null;
  rating: number | null;
}

export interface SeasonDetail {
  number: number;
  name: string;
  overview: string;
  episodes: EpisodeDetail[];
}

export interface CatalogOptions {
  query?: string;
  type?: MediaType | 'all';
  genres?: number[];
  page?: number;
}

export interface CatalogResult {
  source: CatalogSource;
  items: MediaItem[];
  page: number;
  totalPages: number;
}
