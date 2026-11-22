export type CatalogType = 'all' | 'movie' | 'tv';
export type CatalogFilters = { query: string; type: CatalogType; genres: number[] };
export function catalogUrl({ query, type, genres }: CatalogFilters, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (type !== 'all') params.set('type', type);
  if (genres.length) params.set('genres', genres.join(','));
  if (page > 1) params.set('page', String(page));
  return `/movies${params.size ? '?' + params : ''}`;
}
