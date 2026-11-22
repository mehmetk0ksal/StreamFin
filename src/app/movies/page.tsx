import Link from 'next/link';
import { Suspense } from 'react';
import Image from 'next/image';
import { getCatalog, getGenres, type MediaItem } from '@/lib/tmdb';
import { catalogUrl, type CatalogFilters } from '@/lib/catalog-url';
import Filters from '@/components/CatalogFilters';
import FeaturedMedia from '@/components/FeaturedMedia';
import FilmIcon from '@/components/FilmIcon';
import Loading from './loading';

export const metadata = { title: 'Film ve dizi keşfi · StreamFin' };

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function Poster({ item }: { item: MediaItem }) {
  return (
    <Link href={`/movies/${item.type}/${item.id}`} className="poster-card">
      <div className="poster-image">
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
            alt=""
            fill
            sizes="(max-width:560px) 45vw,(max-width:920px) 24vw,17vw"
            unoptimized
          />
        ) : (
          <FilmIcon name="film" size={42} />
        )}
        {item.rating !== null && (
          <span className="poster-rating" aria-label={`TMDB puanı ${item.rating.toFixed(1)}`}>
            <FilmIcon name="star" size={12} />
            {item.rating.toFixed(1)}
          </span>
        )}
      </div>
      <h3>{item.title}</h3>
      <div className="poster-meta">
        {item.year && (
          <>
            <span>{item.year}</span>
            <i />
          </>
        )}
        <span>{item.type === 'movie' ? 'Film' : 'Dizi'}</span>
      </div>
    </Link>
  );
}

type CatalogProps = { searchParams: Promise<Params> };

export default function Movies(props: CatalogProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Catalog {...props} />
    </Suspense>
  );
}

async function Catalog({ searchParams }: CatalogProps) {
  const p = await searchParams;
  const type = first(p.type);
  const filters: CatalogFilters = {
    type: type === 'movie' || type === 'tv' ? type : 'all',
    query: (first(p.q) || '').trim().slice(0, 200),
    genres: [
      ...new Set(
        (first(p.genres) || '')
          .split(',')
          .map(Number)
          .filter((n) => Number.isSafeInteger(n) && n > 0)
      ),
    ].slice(0, 30),
  };
  const page = Math.max(1, Math.min(500, Math.floor(Number(first(p.page))) || 1));
  const [catalog, genres] = await Promise.all([
    getCatalog({ ...filters, page }),
    getGenres(filters.type),
  ]);
  const filtering = Boolean(
    filters.query || filters.genres.length || filters.type !== 'all' || page !== 1
  );
  const featured = catalog.items.filter((item) => item.backdropUrl).slice(0, 4);
  return (
    <main className="cinema-wrap">
      {!filtering && <FeaturedMedia items={featured} />}
      <section className="catalog-section" id="katalog">
        <Filters key={catalogUrl(filters, page)} filters={filters} genres={genres} />
        {filtering && (
          <div className="filter-summary">
            <span>
              {filters.query ? `“${filters.query}” için sonuçlar` : 'Filtrelenmiş katalog'}
              {filters.genres.length > 0 &&
                ' · ' +
                  genres
                    .filter((g) => filters.genres.includes(g.id))
                    .map((g) => g.name)
                    .join(', ')}
            </span>
            <Link href="/movies">Seçimi temizle</Link>
          </div>
        )}
        {catalog.items.length ? (
          <div className="poster-grid">
            {catalog.items.map((item) => (
              <Poster key={item.type + item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <FilmIcon name="search" size={32} />
            <h3>Yapım bulunamadı</h3>
            <p>Başka bir başlık arayabilir veya tür seçimini değiştirebilirsin.</p>
            <Link href="/movies">Tüm kataloğu göster</Link>
          </div>
        )}
        {(catalog.totalPages > 1 || page > 1) && (
          <nav aria-label="Katalog sayfaları" className="pagination">
            {page > 1 && <Link href={catalogUrl(filters, page - 1)}>Önceki</Link>}
            <span>Sayfa {page}</span>
            {page < catalog.totalPages && <Link href={catalogUrl(filters, page + 1)}>Sonraki</Link>}
          </nav>
        )}
      </section>
    </main>
  );
}
