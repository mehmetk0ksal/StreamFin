'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Review, ReviewType, WatchlistEntry, WatchStatus } from '@/lib/library-types';
import { REVIEW_TEXT_MAX_LENGTH, STATUS_LABELS } from '@/lib/library-types';
import styles from './Library.module.css';

export interface MediaLibraryPanelProps {
  mediaType: ReviewType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  parentTitle?: string;
}

export const mediaLabels: Record<ReviewType, string> = {
  movie: 'Film', tv: 'Dizi', season: 'Sezon', episode: 'Bölüm',
};

export function detailHref(type: ReviewType, id: number, season?: number | null, episode?: number | null) {
  const query = new URLSearchParams();
  if (season != null) query.set('season', String(season));
  if (episode != null) query.set('episode', String(episode));
  const path = `/movies/${type === 'movie' ? 'movie' : 'tv'}/${id}`;
  return query.size ? `${path}?${query}` : path;
}

class LibraryRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function libraryRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new LibraryRequestError(body.error || 'İşlem tamamlanamadı. Lütfen tekrar dene.', response.status);
  }
  return response.json();
}

type Remote<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string; unauthorized: boolean };

export function useLibraryData<T>(url: string | null, revision: number): Remote<T> {
  const key = `${revision}|${url}`;
  const [result, setResult] = useState<{ key: string; value: Remote<T> }>();
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    libraryRequest<T>(url, { signal: controller.signal }).then(
      (data) => { if (!controller.signal.aborted) setResult({ key, value: { status: 'ready', data } }); },
      (error) => {
        if (!controller.signal.aborted) {
          setResult({ key, value: {
            status: 'error',
            message: error instanceof LibraryRequestError ? error.message : 'Bağlantı kurulamadı. Lütfen tekrar dene.',
            unauthorized: error instanceof LibraryRequestError && error.status === 401,
          } });
        }
      },
    );
    return () => controller.abort();
  }, [key, url]);
  return result?.key === key ? result.value : { status: 'loading' };
}

export function LoginPrompt({ next, children }: { next: string; children: React.ReactNode }) {
  return (
    <div className={styles.prompt}>
      <p>{children}</p>
      <Link className={styles.primary} href={`/login?next=${encodeURIComponent(next)}`}>Giriş yap</Link>
    </div>
  );
}

export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className={styles.inlineError} role="alert">
      <span>{message}</span>
      <button className={styles.textButton} onClick={retry}>Tekrar dene</button>
    </div>
  );
}

type EditorProps = { onSaved: (message: string) => void };

export function ReviewEditor({ review, target, onSaved, onCancel }: EditorProps & {
  review?: Review;
  target?: MediaLibraryPanelProps;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(review?.rating.toString() ?? '');
  const [reviewText, setReviewText] = useState(review?.review_text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || (!target && !review)) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        rating: Number(rating), review_text: reviewText.trim(),
        ...(!review && target && {
          media_type: target.mediaType, tmdb_id: target.tmdbId,
          media_title: target.mediaType === 'episode' || target.mediaType === 'season'
            ? (target.parentTitle || target.title) : target.title,
          season_number: target.seasonNumber, episode_number: target.episodeNumber,
        }),
      };
      await libraryRequest(review ? `/api/reviews/${review.review_id}` : '/api/reviews', {
        method: review ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      onSaved(review ? 'Değerlendirmen güncellendi.' : 'Değerlendirmen kaydedildi.');
    } catch (err) {
      setError(err instanceof LibraryRequestError ? err.message : 'Değerlendirme kaydedilemedi.');
    } finally { setBusy(false); }
  }

  async function remove() {
    if (busy || !review) return;
    setBusy(true);
    setError('');
    try {
      await libraryRequest(`/api/reviews/${review.review_id}`, { method: 'DELETE' });
      onSaved('Değerlendirmen silindi.');
    } catch (err) {
      setError(err instanceof LibraryRequestError ? err.message : 'Değerlendirme silinemedi.');
    } finally { setBusy(false); }
  }

  return (
    <form className={styles.editor} onSubmit={submit}>
      {review?.is_hidden && <p className={styles.muted}>Bu değerlendirme moderasyon nedeniyle yalnızca sana görünüyor.</p>}
      <label className={styles.field}>Puanın
        <select required value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="" disabled>Puan seç</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} / 10</option>)}
        </select>
      </label>
      <label className={styles.field}>Yorumun <span className={styles.optional}>(isteğe bağlı)</span>
        <textarea rows={3} maxLength={REVIEW_TEXT_MAX_LENGTH} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Bu yapım hakkında ne düşündün?" />
      </label>
      <div className={styles.actions}>
        <button className={styles.primary} disabled={busy} type="submit">{review ? 'Değişiklikleri kaydet' : 'Değerlendirmeyi kaydet'}</button>
        {onCancel && <button className={styles.secondary} disabled={busy} type="button" onClick={onCancel}>Vazgeç</button>}
        {review && <button type="button" className={styles.danger} disabled={busy} onClick={() => setConfirmDelete(true)}>Sil</button>}
      </div>
      {confirmDelete && (
        <div className={styles.confirm}>
          <span>Değerlendirmen silinsin mi?</span>
          <button type="button" className={styles.danger} disabled={busy} onClick={remove}>Evet, sil</button>
          <button type="button" className={styles.textButton} disabled={busy} onClick={() => setConfirmDelete(false)}>Vazgeç</button>
        </div>
      )}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </form>
  );
}

export function WatchEditor({ entry, target, onSaved }: EditorProps & {
  entry?: WatchlistEntry;
  target?: MediaLibraryPanelProps;
}) {
  const [status, setStatus] = useState<WatchStatus>(entry?.status ?? 'plan_to_watch');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function change(remove = false) {
    if (busy || (!entry && !target)) return;
    setBusy(true);
    setError('');
    try {
      const body = entry ? { status } : {
        media_type: target!.mediaType, tmdb_id: target!.tmdbId, media_title: target!.title,
        poster_path: target!.posterPath, status,
      };
      await libraryRequest(entry ? `/api/watchlist/${entry.watchlist_id}` : '/api/watchlist', {
        method: remove ? 'DELETE' : entry ? 'PATCH' : 'POST',
        ...(remove ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      onSaved(remove ? 'Yapım izleme listenden çıkarıldı.' : entry ? 'İzleme durumu güncellendi.' : 'Yapım izleme listene eklendi.');
    } catch (err) {
      setError(err instanceof LibraryRequestError ? err.message : 'İzleme listesi güncellenemedi.');
    } finally { setBusy(false); }
  }
  return (
    <div className={styles.editor}>
      <div className={styles.actions}>
        <select aria-label="İzleme durumu" value={status} disabled={busy} onChange={(e) => setStatus(e.target.value as WatchStatus)}>
          {(Object.keys(STATUS_LABELS) as WatchStatus[]).map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
        </select>
        <button disabled={busy || (entry != null && status === entry.status)} className={entry ? styles.secondary : styles.primary} onClick={() => change()}>
          {entry ? 'Durumu kaydet' : 'Listeme ekle'}
        </button>
        {entry && <button className={styles.danger} disabled={busy} onClick={() => setConfirmDelete(true)}>Listeden çıkar</button>}
      </div>
      {confirmDelete && (
        <div className={styles.confirm}>
          <span>Bu yapım listenden çıkarılsın mı?</span>
          <button className={styles.danger} disabled={busy} onClick={() => change(true)}>Evet, çıkar</button>
          <button className={styles.textButton} disabled={busy} onClick={() => setConfirmDelete(false)}>Vazgeç</button>
        </div>
      )}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  );
}
