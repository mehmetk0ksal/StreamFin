import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Suspense } from 'react';

async function HomeDestination() {
  const user = await getCurrentUser();

  return redirect(user ? '/profile' : '/movies');
}

export default function Home() {
  return <Suspense fallback={null}><HomeDestination /></Suspense>;
}
