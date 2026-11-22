import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="cinema-wrap">
      <div className="catalog-empty">
        <h1>Yapım bulunamadı</h1>
        <p>Bu başlık, sezon veya bölüm katalogda yer almıyor.</p>
        <Link href="/movies">Kataloğa dön</Link>
      </div>
    </main>
  );
}
