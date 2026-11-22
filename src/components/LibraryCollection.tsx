'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Review, ReviewList, WatchlistEntry, WatchStatus } from '@/lib/library-types';
import { STATUS_LABELS } from '@/lib/library-types';
import {
  detailHref, LoadError, LoginPrompt, mediaLabels, ReviewEditor, WatchEditor, useLibraryData,
} from './LibraryControls';
import styles from './Library.module.css';

type Tab = 'watchlist' | 'reviews';
type Category = 'all' | 'movie' | 'tv';

function libraryHref(tab: Tab, type: Category) {
  const query = new URLSearchParams();
  if (tab === 'reviews') query.set('tab', tab);
  if (type !== 'all') query.set('type', type);
  return '/movies/library' + (query.size ? `?${query}` : '');
}

function BookmarkIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4V4Z" /></svg>;
}

function posterUrl(path: string | null) {
  if (!path) return null;
  if (/^\/[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(path)) return 'https://image.tmdb.org/t/p/w185' + path;
  if (/^\/catalog\/[\w./-]+$/i.test(path)) return path;
  return null;
}

function WatchCard({ entry, onSaved }: { entry: WatchlistEntry; onSaved: (message: string) => void }) {
  const poster = posterUrl(entry.poster_path);
  const detail = detailHref(entry.media_type, entry.tmdb_id);
  return (
    <article className={styles.record}>
      <Link className={styles.poster} href={detail} aria-label={`${entry.media_title} ayrıntıları`}>
        {poster ? <Image unoptimized src={poster} width={66} height={96} alt="" /> : <BookmarkIcon />}
      </Link>
      <div className={styles.recordBody}>
        <span className={styles.meta}>{mediaLabels[entry.media_type]}</span>
        <h3><Link href={detail}>{entry.media_title}</Link></h3>
        <WatchEditor entry={entry} onSaved={onSaved} />
      </div>
    </article>
  );
}

function ReviewCard({ review, onSaved }: { review: Review; onSaved: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const detail = detailHref(review.media_type, review.tmdb_id, review.season_number, review.episode_number);
  const level = [
    mediaLabels[review.media_type],
    review.season_number != null ? `${review.season_number}. sezon` : '',
    review.episode_number != null ? `${review.episode_number}. bölüm` : '',
  ].filter(Boolean).join(' · ');
  return (
    <article className={styles.record}>
      <div className={styles.recordBody}>
        <div className={styles.headingRow}>
          <div><span className={styles.meta}>{level}</span><h3><Link href={detail}>{review.media_title}</Link></h3></div>
          <span className={styles.rating}>★ {review.rating}<small> / 10</small></span>
        </div>
        {editing ? <ReviewEditor review={review} onSaved={onSaved} onCancel={() => setEditing(false)} /> : <>
          {review.review_text && <p className={styles.reviewText}>{review.review_text}</p>}
          {review.is_hidden && <p className={styles.muted}>Moderasyon nedeniyle gizlendi.</p>}
          <button className={styles.textButton} onClick={() => setEditing(true)}>Değerlendirmeyi düzenle</button>
        </>}
      </div>
    </article>
  );
}

export default function LibraryCollection({ tab, type }: { tab: Tab; type: Category }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WatchStatus | ''>('');
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const watch = useLibraryData<{ watchlist: WatchlistEntry[] }>(tab === 'watchlist' ? '/api/watchlist' : null, revision);
  const reviews = useLibraryData<ReviewList>(tab === 'reviews' ? '/api/reviews?mine=1' : null, revision);
  const active = tab === 'watchlist' ? watch : reviews;
  const retry = () => setRevision((v) => v + 1);
  const onSaved = (message: string) => { setNotice(message); retry(); };
  const q = search.trim().toLocaleLowerCase('tr-TR');
  const matches = (row: Review | WatchlistEntry) =>
    (type === 'all' || (type === 'movie' ? row.media_type === 'movie' : row.media_type !== 'movie')) &&
    row.media_title.toLocaleLowerCase('tr-TR').includes(q);
  const items = watch.status === 'ready' ? watch.data.watchlist.filter((w) => matches(w) && (!status || w.status === status)) : [];
  const ratings = reviews.status === 'ready' ? reviews.data.reviews.filter(matches) : [];
  const hasAny = watch.status === 'ready' ? watch.data.watchlist.length > 0 : reviews.status === 'ready' && reviews.data.reviews.length > 0;
  return (
    <main className={styles.library}>
      <Link href="/movies" className={styles.back}><span aria-hidden="true">←</span> Film ve dizi keşfi</Link>
      <h1>Arşivim</h1>
      <nav className={styles.tabs} aria-label="Arşiv bölümü">
        <Link aria-current={tab === 'watchlist' ? 'page' : undefined} href={libraryHref('watchlist', type)}>İzleme listem</Link>
        <Link aria-current={tab === 'reviews' ? 'page' : undefined} href={libraryHref('reviews', type)}>Değerlendirmelerim</Link>
      </nav>
      {notice && <p role="status" className={styles.success}>{notice}</p>}
      {active.status === 'loading' && <p role="status" className={styles.empty}>Arşivin yükleniyor…</p>}
      {active.status === 'error' && (active.unauthorized ? (
        <div className={styles.empty}><BookmarkIcon /><h2>Arşivini görüntüle</h2>
          <LoginPrompt next={libraryHref(tab, type)}>İzleme listene ve değerlendirmelerine erişmek için giriş yap.</LoginPrompt>
        </div>
      ) : <LoadError message={active.message} retry={retry} />)}
      {active.status === 'ready' &&
        <>
          {(hasAny || type !== 'all') && <div className={styles.toolbar}>
            <nav aria-label="Yapım türü" className={styles.pills}>
              {(['all', 'movie', 'tv'] as const).map((category) => <Link key={category} href={libraryHref(tab, category)} aria-current={category === type ? 'true' : undefined}>
                {{ all: 'Tümü', movie: 'Filmler', tv: 'Diziler' }[category]}
              </Link>)}
            </nav>
            <div className={styles.filters}>
              <input type="search" aria-label="Arşivde başlığa göre ara" placeholder="Başlığa göre ara" value={search} onChange={(e) => setSearch(e.target.value)} />
              {tab === 'watchlist' && <select aria-label="İzleme durumuna göre filtrele" value={status} onChange={(e) => setStatus(e.target.value as WatchStatus | '')}>
                <option value="">Tüm durumlar</option>
                {(Object.keys(STATUS_LABELS) as WatchStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>}
            </div>
          </div>}
          {items.length + ratings.length > 0 ? (
            <div className={styles.records}>
              {items.map((entry) => <WatchCard key={entry.watchlist_id} entry={entry} onSaved={onSaved} />)}
              {ratings.map((review) => <ReviewCard key={review.review_id} review={review} onSaved={onSaved} />)}
            </div>
          ) : (
            <div className={styles.empty}><BookmarkIcon />
              <h2>{hasAny ? 'Bu filtrelerle eşleşen kayıt yok' : tab === 'watchlist' ? 'İzleme listen henüz boş' : 'Henüz değerlendirme yazmadın'}</h2>
              {hasAny ? <Link className={styles.secondary} onClick={() => { setSearch(''); setStatus(''); }} href={libraryHref(tab, 'all')}>Filtreleri temizle</Link>
                : <Link className={styles.primary} href="/movies">Film ve dizi keşfet</Link>}
            </div>
          )}
        </>}
    </main>
  );
}
