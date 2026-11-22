import { catalogSource } from '@/lib/tmdb';
import Image from 'next/image';
import './movies.css';

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer className="cinema-footer">
        <span>
          {catalogSource() === 'preview' ? 'Örnek katalog · Sınırlı seçki' : 'Canlı TMDB kataloğu'}
        </span>
        <div className="tmdb-credit">
          <a href="https://www.themoviedb.org/">
            <Image src="/catalog/tmdb.svg" alt="The Movie Database" width={70} height={10} />
          </a>
          <span lang="en">This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </div>
      </footer>
    </>
  );
}
