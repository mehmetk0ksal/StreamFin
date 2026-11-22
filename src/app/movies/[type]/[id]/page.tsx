import { cache, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FilmIcon from '@/components/FilmIcon';
import MediaLibraryPanel from '@/components/MediaLibraryPanel';
import { getEpisode, getMediaDetail, getSeason, type MediaType } from '@/lib/tmdb';
import Loading from '../../loading';
import styles from './detail.module.css';

interface DetailProps {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function numberParam(value: string | string[] | undefined, minimum: number) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) notFound();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > 2147483647) notFound();
  return parsed;
}

const loadDetail = cache(
  async (type: MediaType, id: number, seasonNumber?: number, episodeNumber?: number) => {
    const [media, season, episode] = await Promise.all([
      getMediaDetail(type, id),
      seasonNumber === undefined ? null : getSeason(id, seasonNumber),
      seasonNumber === undefined || episodeNumber === undefined
        ? null
        : getEpisode(id, seasonNumber, episodeNumber),
    ]);
    if (!media || (seasonNumber !== undefined && !season) || (episodeNumber !== undefined && !episode))
      notFound();
    return { media, season, episode };
  }
);

async function resolveDetail(props: DetailProps) {
  const [{ type, id: rawId }, query] = await Promise.all([props.params, props.searchParams]);
  const id = numberParam(rawId, 1);
  const seasonNumber = numberParam(query.season, 0);
  const episodeNumber = numberParam(query.episode, 1);
  if (!id || (type !== 'movie' && type !== 'tv')) notFound();
  if (type !== 'tv' && seasonNumber !== undefined) notFound();
  if (episodeNumber !== undefined && seasonNumber === undefined) notFound();
  return loadDetail(type, id, seasonNumber, episodeNumber);
}

export async function generateMetadata(props: DetailProps) {
  const { media, season, episode } = await resolveDetail(props);
  const names = [episode?.name, season?.name, media.title, 'StreamFin'].filter(Boolean);
  return { title: names.join(' · ') };
}

const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function displayDate(value: string | null) {
  return value ? dateFormat.format(new Date(value + 'T00:00:00Z')) : null;
}

export default function MediaPage(props: DetailProps) {
  return (
    <Suspense fallback={<Loading />}>
      <MediaDetails {...props} />
    </Suspense>
  );
}

async function MediaDetails(props: DetailProps) {
  const { media, season, episode } = await resolveDetail(props);
  const base = `/movies/${media.type}/${media.id}`;
  const seasonHref = season ? `${base}?season=${season.number}` : base;
  const mediaType = episode ? 'episode' : season ? 'season' : media.type;
  const typeLabel = episode ? 'Bölüm' : season ? 'Sezon' : media.type === 'tv' ? 'Dizi' : 'Film';
  const title = episode?.name ?? season?.name ?? media.title;
  const overview = episode ? episode.overview : season ? season.overview : media.overview;
  const backdrop = episode?.stillUrl || media.backdropUrl;
  const date = episode
    ? episode.airDate
    : season
      ? (season.episodes[0]?.airDate ?? null)
      : media.releaseDate;
  const runtime = episode ? episode.runtime : season ? null : media.runtime;
  const rating = episode ? episode.rating : season ? null : media.rating;
  const originalTitle =
    !season && media.originalTitle && media.originalTitle !== media.title ? media.originalTitle : '';
  const mainLabel = media.type === 'movie' ? 'Yönetmen' : 'Dizi yaratıcıları';

  return (
    <main className={styles.detail}>
      <nav className={styles.breadcrumb} aria-label="Sayfa konumu">
        <Link href="/movies">Film ve dizi</Link>
        <FilmIcon name="right" size={13} />
        {season ? (
          <>
            <Link href={base}>{media.title}</Link>
            <FilmIcon name="right" size={13} />
          </>
        ) : null}
        {episode && season ? (
          <>
            <Link href={seasonHref}>{season.name}</Link>
            <FilmIcon name="right" size={13} />
          </>
        ) : null}
        <span aria-current="page">{title}</span>
      </nav>

      <header className={styles.hero}>
        {backdrop && (
          <Image
            src={backdrop}
            className={styles.backdrop}
            fill
            sizes="100vw"
            unoptimized
            preload
            alt=""
          />
        )}
        <div className={styles.scrim} />
        <div className={styles.heroBody}>
          {media.posterUrl && (
            <div className={styles.poster}>
              <Image
                src={media.posterUrl}
                alt={`${media.title} afişi`}
                fill
                sizes="(max-width: 620px) 90px, 180px"
                unoptimized
              />
            </div>
          )}
          <div className={styles.headings}>
            <p className={styles.type}>
              <FilmIcon name={media.type === 'movie' ? 'film' : 'tv'} size={15} />
              {season ? (
                <>
                  {media.title}
                  <span>·</span>
                  {episode ? `S${season.number} B${episode.number}` : typeLabel}
                </>
              ) : (
                typeLabel
              )}
            </p>
            <h1>{title}</h1>
            {originalTitle && <p className={styles.original}>{originalTitle}</p>}
            <div className={styles.facts}>
              {rating !== null && (
                <span className={styles.rating}>
                  <FilmIcon name="star" size={14} />{' '}
                  {rating.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}
                  <small> / 10 · TMDB</small>
                </span>
              )}
              {date && <time dateTime={date}>{displayDate(date)}</time>}
              {runtime && <span>{runtime} dk</span>}
              {season && !episode && <span>{season.episodes.length} bölüm</span>}
            </div>
            {!!media.genres.length && (
              <ul className={styles.genres} aria-label="Türler">
                {media.genres.map((genre) => (
                  <li key={genre}>{genre}</li>
                ))}
              </ul>
            )}
            <div className={styles.shortcuts}>
              <a href="#topluluk" className={styles.primary}>
                <FilmIcon name="star" size={14} />
                Değerlendirmeler
              </a>
              {media.seasons.length > 0 && (
                <a href="#sezonlar" className={styles.secondary}>
                  <FilmIcon name="layers" size={15} />
                  Sezonlar
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className={styles.about} aria-label="Yapım bilgileri">
        <div>
          <h2>Özet</h2>
          <p>{overview || 'Bu yapım için henüz Türkçe özet eklenmemiş.'}</p>
        </div>
        {(media.creators.length > 0 || media.cast.length > 0) && (
          <dl className={styles.credits}>
            {!!media.creators.length && (
              <div>
                <dt>{mainLabel}</dt>
                <dd>{media.creators.join(', ')}</dd>
              </div>
            )}
            {!!media.cast.length && (
              <div>
                <dt>{season ? 'Dizi oyuncuları' : 'Oyuncular'}</dt>
                <dd>{media.cast.join(', ')}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      {media.type === 'tv' && (media.seasons.length > 0 || season) && (
        <section id="sezonlar" className={styles.seasonSection}>
          <h2>Sezonlar</h2>
          <nav className={styles.seasons} aria-label={`${media.title} sezonları`}>
            {media.seasons.map((item) => (
              <Link
                key={item.number}
                href={`${base}?season=${item.number}`}
                aria-current={item.number === season?.number ? 'true' : undefined}
              >
                {item.name}
                <small>{item.episodeCount} bölüm</small>
              </Link>
            ))}
          </nav>
          {season && (
            <details className={styles.episodeList} key={season.number} open={!episode}>
              <summary>
                {season.name} bölümleri <FilmIcon name="down" size={16} />
              </summary>
              {season.episodes.length === 0 && <p>Bu sezonun bölümleri henüz eklenmemiş.</p>}
              <ol>
                {season.episodes.map((item) => (
                  <li key={item.number}>
                    <Link
                      href={`${seasonHref}&episode=${item.number}`}
                      aria-current={item.number === episode?.number ? 'page' : undefined}
                    >
                      <span className={styles.ordinal}>{item.number}. bölüm</span>
                      <strong>{item.name}</strong>
                      {item.runtime && <small>{item.runtime} dk</small>}
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      )}

      <div id="topluluk" className={styles.community}>
        <MediaLibraryPanel
          mediaType={mediaType}
          tmdbId={media.id}
          title={title}
          posterPath={media.posterPath}
          parentTitle={media.title}
          seasonNumber={season?.number}
          episodeNumber={episode?.number}
        />
      </div>
    </main>
  );
}
