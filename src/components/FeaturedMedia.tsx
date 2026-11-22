'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { MediaItem } from '@/lib/tmdb';
import FilmIcon from './FilmIcon';

export default function FeaturedMedia({ items }: { items: MediaItem[] }) {
  const [position, setPosition] = useState(0);
  const item = items[position] ?? items[0];
  if (!item) return null;
  const art = item.backdropUrl || item.posterUrl;
  const href = `/movies/${item.type}/${item.id}`;
  function move(offset: number) {
    setPosition((i) => (i + offset + items.length) % items.length);
  }
  return (
    <section className="feature" aria-label="Öne çıkan yapımlar" aria-roledescription="karusel">
      {art && (
        <Image
          key={art}
          className="feature-art"
          src={art}
          alt=""
          fill
          sizes="(min-width: 1440px) 1340px, 100vw"
          unoptimized
          preload
        />
      )}
      <div className="feature-shade" />
      <div className="feature-copy" aria-live="polite">
        <div className="feature-tag">
          <span className="tag-rule" />
          <FilmIcon name="sparkle" size={16} /> ÖNE ÇIKAN YAPIM
        </div>
        <h1>{item.title}</h1>
        <div className="film-meta">
          {item.rating !== null && (
            <span className="score">
              <FilmIcon name="star" size={15} /> {item.rating.toFixed(1)}
            </span>
          )}
          {item.year && <span>{item.year}</span>}
          <span>{item.type === 'movie' ? 'Film' : 'Dizi'}</span>
          {item.genres.slice(0, 2).map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>
        {item.overview && <p>{item.overview}</p>}
        <Link className="primary-action" href={href}>
          <FilmIcon name="film" />
          Yapımı incele
        </Link>
      </div>
      {items.length > 1 && (
        <div className="feature-controls">
          <div className="slide-lines">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPosition(i)}
                aria-label={`${i + 1}. yapımı göster`}
                aria-pressed={i === position}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="round-control"
            onClick={() => move(-1)}
            aria-label="Önceki yapım"
          >
            <FilmIcon name="left" />
          </button>
          <button
            type="button"
            className="round-control"
            onClick={() => move(1)}
            aria-label="Sonraki yapım"
          >
            <FilmIcon name="right" />
          </button>
        </div>
      )}
    </section>
  );
}
