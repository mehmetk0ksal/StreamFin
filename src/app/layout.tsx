import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'StreamFin',
  description: 'Film ve dizileri keşfet, değerlendirmelerini yaz ve izleme listeni oluştur.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="tr"><body>
    <Suspense fallback={<header className="site-header"/>}><Navbar/></Suspense>
    {children}
  </body></html>;
}
