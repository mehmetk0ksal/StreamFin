'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { catalogUrl, type CatalogFilters } from '@/lib/catalog-url';
import FilmIcon from './FilmIcon';

type Genre = { id: number; name: string };

export default function Filters({ filters, genres }: { filters: CatalogFilters; genres: Genre[] }) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(filters.genres);
  const types = [
    ['all', 'Tümü', 'grid'],
    ['movie', 'Filmler', 'film'],
    ['tv', 'Diziler', 'tv'],
  ] as const;
  function apply(patch: Partial<CatalogFilters>) {
    router.push(catalogUrl({ ...filters, query: query.trim(), ...patch }), { scroll: false });
  }
  return (
    <div className="catalog-tools">
      <div className="catalog-heading">
        <h2>Kataloğu keşfet</h2>
        <form
          className="catalog-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            apply({});
          }}
        >
          <input
            aria-label="Film veya dizi adı"
            name="q"
            value={query}
            maxLength={200}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Film veya dizi ara…"
          />
          <button aria-label="Ara">
            <FilmIcon name="search" size={19} />
          </button>
        </form>
      </div>
      <div className="catalog-controls">
        <div className="type-tabs" aria-label="Yapım türü">
          {types.map(([type, label, icon]) => (
            <button
              type="button"
              key={type}
              aria-pressed={filters.type === type}
              onClick={() => apply({ type })}
            >
              <FilmIcon name={icon} size={16} />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="genre-button"
          aria-expanded={open}
          aria-controls="genre-picker"
          onClick={() => setOpen(!open)}
        >
          <FilmIcon name="sliders" size={16} />
          Türler{chosen.length > 0 && <span>{chosen.length}</span>}
          <FilmIcon name="down" size={14} />
        </button>
      </div>
      {open && (
        <fieldset className="genre-picker" id="genre-picker">
          <legend>Tür seçimi</legend>
          <div>
            {genres.map((g) => (
              <label key={g.id}>
                <input
                  type="checkbox"
                  checked={chosen.includes(g.id)}
                  onChange={(e) =>
                    setChosen(e.target.checked ? [...chosen, g.id] : chosen.filter((id) => id !== g.id))
                  }
                />
                {g.name}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="filter-apply"
            onClick={() => {
              apply({ genres: chosen });
              setOpen(false);
            }}
          >
            Uygula
          </button>
        </fieldset>
      )}
    </div>
  );
}
