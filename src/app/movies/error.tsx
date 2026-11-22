'use client';

import Link from 'next/link';

export default function MovieError({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="cinema-wrap">
      <div className="catalog-empty" role="alert">
        <h1>Katalog bilgileri alınamadı</h1>
        <p>TMDB bağlantısını kontrol edip tekrar deneyebilirsin.</p>
        <button className="primary-action" onClick={retry}>
          Tekrar dene
        </button>
        <Link href="/movies/library">İzleme listeme git</Link>
      </div>
    </main>
  );
}
