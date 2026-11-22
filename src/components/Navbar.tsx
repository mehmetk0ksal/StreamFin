'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FilmIcon from './FilmIcon';

interface NavUser {
  username: string;
  role_name: 'admin' | 'user';
}

export default function Navbar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [busy, setBusy] = useState(false);
  const accountRef = pathname.startsWith('/movies')
    ? '?next=' + encodeURIComponent(pathname + (search.size ? '?' + search.toString() : ''))
    : '';
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/me', { signal: controller.signal, cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!controller.signal.aborted) setUser(data.user || null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setUser(null);
      });
    return () => controller.abort();
  }, [pathname]);
  async function logout() {
    setBusy(true);
    try {
      const result = await fetch('/api/auth/logout', { method: 'POST' });
      if (result.ok) {
        setUser(null);
        router.push('/login');
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }
  const library = pathname.startsWith('/movies/library');
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link className="site-brand" href="/" aria-label="StreamFin ana sayfa">
          <Image src="/uygulama-logosu.jpeg" alt="" width={46} height={46} />
          <span>
            Stream<b>Fin</b>
          </span>
        </Link>
        <nav aria-label="Ana menü" className="primary-nav">
          <Link data-active={pathname.startsWith('/movies') && !library} href="/movies">
            <FilmIcon name="compass" size={17} />
            Keşfet
          </Link>
          <Link data-active={library} href="/movies/library">
            <FilmIcon name="bookmark" size={16} />
            Arşivim
          </Link>
          <Link data-active={pathname.startsWith('/music')} href="/music">
            Müzik
          </Link>
          <Link data-active={pathname.startsWith('/videos')} href="/videos">
            Videolar
          </Link>
          {user?.role_name === 'admin' && (
            <Link data-active={pathname === '/admin'} href="/admin">
              Admin Paneli
            </Link>
          )}
        </nav>
        <div className="account-links">
          {user ? (
            <>
              <Link className="nav-login" href="/profile">
                <FilmIcon name="user" size={16} />
                {user.username}
              </Link>
              <button type="button" className="nav-register" onClick={logout} disabled={busy}>
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link className="nav-login" href={'/login' + accountRef}>
                Giriş yap
              </Link>
              <Link className="nav-register" href={'/register' + accountRef}>
                Kayıt ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
