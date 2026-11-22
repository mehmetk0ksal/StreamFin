import type { EpisodeDetail, MediaDetail, MediaType, SeasonDetail } from './tmdb-types';

// A small, explicitly labelled offline selection. IDs match TMDB so that saved
// entries continue to open after a team member configures their API token.
export const previewGenres = [
  { id: 878, name: 'Bilim Kurgu' }, { id: 18, name: 'Dram' },
  { id: 12, name: 'Macera' }, { id: 16, name: 'Animasyon' },
  { id: 14, name: 'Fantastik' }, { id: 35, name: 'Komedi' },
  { id: 9648, name: 'Gizem' }, { id: 10749, name: 'Romantik' },
  { id: 10751, name: 'Aile' }, { id: 28, name: 'Aksiyon' },
];

interface PreviewTitle {
  id: number;
  type: MediaType;
  slug: string;
  title: string;
  originalTitle: string;
  overview: string;
  genres: number[];
  releaseDate: string;
  runtime: number | null;
  rating: number;
  cast: string[];
  creators: string[];
}

export const previewTitles: PreviewTitle[] = [
  {
    id: 335984, type: 'movie', slug: 'blade-runner-2049',
    title: 'Blade Runner 2049', originalTitle: 'Blade Runner 2049',
    overview: 'Los Angeles, 2049. Memur K, terk edilmiş bir çiftlikte bulduğu bir iz sayesinde otuz yıldır kayıp olan Rick Deckard’ın peşine düşer.',
    genres: [878, 18, 9648], releaseDate: '2017-10-04', runtime: 164, rating: 7.6,
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas'], creators: ['Denis Villeneuve'],
  },
  {
    id: 693134, type: 'movie', slug: 'dune-part-two',
    title: 'Dune: Çöl Gezegeni Bölüm İki', originalTitle: 'Dune: Part Two',
    overview: 'Arrakis’in çöllerinde Fremenlere katılan Paul, Chani ile kurduğu hayatı ve ailesinin geleceği için vereceği savaşı tartar.',
    genres: [878, 12, 28], releaseDate: '2024-02-27', runtime: 167, rating: 8.1,
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'], creators: ['Denis Villeneuve'],
  },
  {
    id: 87108, type: 'tv', slug: 'chernobyl', title: 'Çernobil', originalTitle: 'Chernobyl',
    overview: 'Nisan 1986’da bir reaktör patlar. Bilim insanları, itfaiyeciler ve santral çalışanları, kazanın boyutunu anlamak için zamanla yarışır.',
    genres: [18], releaseDate: '2019-05-06', runtime: null, rating: 8.7,
    cast: ['Jared Harris', 'Stellan Skarsgård', 'Emily Watson'], creators: ['Craig Mazin'],
  },
  {
    id: 129, type: 'movie', slug: 'spirited-away', title: 'Ruhların Kaçışı', originalTitle: '千と千尋の神隠し',
    overview: 'Chihiro, ailesiyle geçtiği bir tünelin öbür ucunda ruhların işlettiği bir hamam bulur. Eve dönebilmek için orada kendine bir yer edinmesi gerekir.',
    genres: [16, 10751, 14], releaseDate: '2001-07-20', runtime: 125, rating: 8.5,
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'], creators: ['Hayao Miyazaki'],
  },
  {
    id: 157336, type: 'movie', slug: 'interstellar', title: 'Yıldızlararası', originalTitle: 'Interstellar',
    overview: 'Dünya’da hasatlar birer birer tükenirken eski pilot Cooper, Satürn yakınlarındaki bir solucan deliğinden geçecek keşif ekibine katılır.',
    genres: [12, 18, 878], releaseDate: '2014-11-05', runtime: 169, rating: 8.5,
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], creators: ['Christopher Nolan'],
  },
  {
    id: 87739, type: 'tv', slug: 'queens-gambit', title: 'Vezir Gambiti', originalTitle: "The Queen's Gambit",
    overview: 'Beth Harmon satrancı bir yetimhanenin bodrumunda öğrenir. Yeteneği onu Kentucky’den uluslararası turnuvalara taşır.',
    genres: [18], releaseDate: '2020-10-23', runtime: null, rating: 8.5,
    cast: ['Anya Taylor-Joy', 'Marielle Heller', 'Thomas Brodie-Sangster'], creators: ['Scott Frank', 'Allan Scott'],
  },
  {
    id: 120467, type: 'movie', slug: 'grand-budapest-hotel', title: 'Büyük Budapeşte Oteli', originalTitle: 'The Grand Budapest Hotel',
    overview: 'Bir otel görevlisi ve genç çırağı, yaşlı bir konuğun miras bıraktığı tablo yüzünden kendilerini bir cinayet soruşturmasının ortasında bulur.',
    genres: [35, 18], releaseDate: '2014-02-26', runtime: 100, rating: 8.0,
    cast: ['Ralph Fiennes', 'Tony Revolori', 'Saoirse Ronan'], creators: ['Wes Anderson'],
  },
  {
    id: 372058, type: 'movie', slug: 'your-name', title: 'Senin Adın', originalTitle: '君の名は。',
    overview: 'Tokyo’da yaşayan Taki ve dağ kasabasında büyüyen Mitsuha, bazı sabahlar birbirlerinin hayatına uyanır. Bıraktıkları notlar ikisini birbirine yaklaştırır.',
    genres: [16, 10749, 18], releaseDate: '2016-08-26', runtime: 106, rating: 8.5,
    cast: ['Ryunosuke Kamiki', 'Mone Kamishiraishi'], creators: ['Makoto Shinkai'],
  },
];

type PreviewEpisode = [name: string, runtime: number, airDate: string, overview: string];

const previewEpisodes: Record<number, PreviewEpisode[]> = {
  87108: [
    ['1:23:45', 65, '2019-05-06', 'Gece vardiyasında duyulan patlamanın ardından Pripyat itfaiyesi santrale çağrılır.'],
    ['Please Remain Calm', 70, '2019-05-13', 'Legasov, kazanın gerçek boyutunu açıklamak üzere hükümet komisyonuna katılır.'],
    ['Open Wide, O Earth', 66, '2019-05-20', 'Reaktörün altındaki su ve toprak için ayrı ekipler harekete geçer.'],
    ['The Happiness of All Mankind', 71, '2019-05-27', 'Tasfiye ekipleri kirlenmiş bölgeye girerken bilim insanları patlamaya giden kararları inceler.'],
    ['Vichnaya Pamyat', 78, '2019-06-03', 'Legasov ve Şçerbina, santral yöneticilerinin yargılandığı duruşmada ifade verir.'],
  ],
  87739: [
    ['Openings', 59, '2020-10-23', 'Beth, yetimhanenin hademesi Bay Shaibel ile ilk satranç oyununu oynar.'],
    ['Exchanges', 65, '2020-10-23', 'Yeni bir eve taşınan Beth, Kentucky’deki ilk turnuvasına kaydolur.'],
    ['Doubled Pawns', 46, '2020-10-23', 'Turnuvalar arasında geçen yolculuklar Beth ile Alma’yı yakınlaştırır.'],
    ['Middle Game', 49, '2020-10-23', 'Beth, Meksika’da Sovyet şampiyon Borgov ile karşılaşmaya hazırlanır.'],
    ['Fork', 48, '2020-10-23', 'Lexington’a dönen Beth, eski bir rakibiyle antrenmana başlar.'],
    ['Adjournment', 60, '2020-10-23', 'New York’ta çalışan Beth, Paris’teki karşılaşma için yola çıkar.'],
    ['End Game', 68, '2020-10-23', 'Beth, Moskova’daki turnuvada dünyanın önde gelen oyuncularıyla masaya oturur.'],
  ],
};

export function previewDetail(title: PreviewTitle): MediaDetail {
  const poster = `/catalog/${title.slug}-poster.jpg`;
  const episodes = previewEpisodes[title.id];
  return {
    id: title.id, type: title.type, title: title.title, originalTitle: title.originalTitle,
    overview: title.overview, year: title.releaseDate.slice(0, 4),
    posterPath: poster, posterUrl: poster, backdropUrl: `/catalog/${title.slug}-backdrop.jpg`,
    rating: title.rating, genres: title.genres.map(id => previewGenres.find(genre => genre.id === id)!.name),
    runtime: title.runtime, releaseDate: title.releaseDate, cast: title.cast, creators: title.creators,
    seasons: episodes ? [{ number: 1, name: '1. Sezon', episodeCount: episodes.length }] : [],
  };
}

export function previewSeason(seriesId: number, seasonNumber: number): SeasonDetail | null {
  const rows = previewEpisodes[seriesId];
  if (!rows || seasonNumber !== 1) return null;
  const episodes: EpisodeDetail[] = rows.map(([name, runtime, airDate, overview], i) => ({
    number: i + 1, name, overview, runtime, airDate, stillUrl: null, rating: null,
  }));
  return { number: 1, name: '1. Sezon', overview: previewTitles.find(t => t.id === seriesId)!.overview, episodes };
}
