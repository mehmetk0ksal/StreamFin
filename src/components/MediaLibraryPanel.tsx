'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ReviewList, WatchlistEntry } from '@/lib/library-types';
import {
  detailHref, LoadError, LoginPrompt, ReviewEditor, WatchEditor, useLibraryData,
  type MediaLibraryPanelProps,
} from './LibraryControls';
import styles from './Library.module.css';

export default function MediaLibraryPanel(props: MediaLibraryPanelProps) {
  const url = detailHref(props.mediaType, props.tmdbId, props.seasonNumber, props.episodeNumber);
  return <Community key={url} next={url} target={props} />;
}

function Community({ target, next }: { target: MediaLibraryPanelProps; next: string }) {
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const retry = () => setRevision((v) => v + 1);
  const onSaved = (message: string) => { setNotice(message); retry(); };
  const search = new URLSearchParams({ media_type: target.mediaType, tmdb_id: String(target.tmdbId) });
  if (target.seasonNumber != null) search.set('season_number', String(target.seasonNumber));
  if (target.episodeNumber != null) search.set('episode_number', String(target.episodeNumber));
  const feed = useLibraryData<ReviewList>(`/api/reviews?${search}`, revision);
  const signedIn = feed.status === 'ready' && feed.data.current_user_id != null;
  const canWatch = target.mediaType === 'movie' || target.mediaType === 'tv';
  const own = useLibraryData<ReviewList>(signedIn ? `/api/reviews?mine=1&${search}` : null, revision);
  const watch = useLibraryData<{watchlist: WatchlistEntry[]}>(
    canWatch && signedIn ? `/api/watchlist?${search}` : null, revision,
  );

  return (
    <section className={styles.community} aria-label="StreamFin topluluğu">
      <div className={styles.headingRow}>
        <h2>Topluluk değerlendirmeleri</h2>
        {feed.status === 'ready' && feed.data.review_count > 0 &&
          <div className={styles.score}>
            <span aria-hidden="true">★</span> <strong>{feed.data.average_rating?.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</strong>
            <small>/ 10 · {feed.data.review_count} oy</small>
          </div>}
      </div>
      {notice && <p role="status" className={styles.success}>{notice}</p>}
      {feed.status === 'loading' && <p className={styles.muted} role="status">Değerlendirmeler yükleniyor…</p>}
      {feed.status === 'error' && <LoadError message={feed.message} retry={retry} />}
      {feed.status === 'ready' && (
        <div className={styles.communityGrid}>
          <div className={styles.feed}>
            {!feed.data.reviews.length && <p className={styles.muted}>Henüz değerlendirme yok.</p>}
            {feed.data.reviews.map((r) => (
              <article className={styles.comment} key={r.review_id}>
                <div className={styles.commentHead}>
                  <span className={styles.avatar} aria-hidden="true">{r.username.slice(0, 1).toLocaleUpperCase('tr-TR')}</span>
                  <div><strong>{r.username}</strong><time dateTime={String(r.created_at)}>{new Date(r.created_at).toLocaleDateString('tr-TR')}</time></div>
                  <span className={styles.rating}>★ {r.rating}<small> / 10</small></span>
                </div>
                {r.review_text && <p>{r.review_text}</p>}
              </article>
            ))}
          </div>
          <div className={styles.memberActions}>
            {!signedIn ? (
              <LoginPrompt next={next}>{canWatch ? 'Puan vermek, yorum yazmak veya izleme listene eklemek için giriş yap.' : 'Puan vermek veya yorum yazmak için giriş yap.'}</LoginPrompt>
            ) : (
              <>
                {canWatch && <section className={styles.card}>
                  <h3>İzleme listem</h3>
                  {watch.status === 'loading' && <p className={styles.muted}>Listen yükleniyor…</p>}
                  {watch.status === 'error' && <LoadError message={watch.message} retry={retry} />}
                  {watch.status === 'ready' && <WatchEditor target={target} entry={watch.data.watchlist[0]} onSaved={onSaved} />}
                </section>}
                <section className={styles.card}>
                  <h3>Değerlendirmem</h3>
                  {own.status === 'loading' && <p className={styles.muted}>Değerlendirmen yükleniyor…</p>}
                  {own.status === 'error' && <LoadError message={own.message} retry={retry} />}
                  {own.status === 'ready' && <ReviewEditor target={target} review={own.data.reviews[0]} onSaved={onSaved} />}
                </section>
                <Link className={styles.back} href="/movies/library">Arşivime git <span aria-hidden="true">→</span></Link>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
