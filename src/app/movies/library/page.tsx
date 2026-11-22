import type { Metadata } from 'next';
import { Suspense } from 'react';
import LibraryCollection from '@/components/LibraryCollection';
import Loading from '../loading';

export const metadata: Metadata = { title: 'Arşivim · StreamFin' };

type LibraryProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function LibraryPage(props: LibraryProps) {
  return (
    <Suspense fallback={<Loading />}>
      <LibraryWithFilters {...props} />
    </Suspense>
  );
}

async function LibraryWithFilters({ searchParams }: LibraryProps) {
  const query = await searchParams;
  const tab = query.tab === 'reviews' ? 'reviews' : 'watchlist';
  const type = query.type === 'movie' || query.type === 'tv' ? query.type : 'all';
  return <LibraryCollection key={`${tab}-${type}`} tab={tab} type={type} />;
}
