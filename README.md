# StreamFin

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları sırasıyla uygulayın.

Film ve dizi modülünü yeni bir klonda kullanacaksanız sunucuyu başlatmadan önce aşağıdaki [modül kurulumunu](#film-ve-dizi-modülü) tamamlayın.

## 1. Repoyu Klonlayın ve Paketleri Kurun

```bash
git clone https://github.com/mehmetk0ksal/StreamFin
cd StreamFin
npm install
```

## 2. Veritabanı Bağlantısını Ayarlayın

Projenin ana dizininde (`package.json` ile aynı seviyede) **`.env.local`** adında bir dosya oluşturun ve içine ortak veritabanı adresini yapıştırın:

```env
DATABASE_URL="postgresql://postgres.uganboyysvshzqpmwbxk:[SIFRE]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

* `[SIFRE]` kısmını köşeli parantezleri silerek paylaşılan veritabanı şifresiyle değiştirin.

## 3. Sunucuyu Başlatın

```bash
npm run dev
```

## 4. Bağlantıyı Test Edin

Sunucu çalışırken tarayıcınızdan şu adrese gidin:

```text
http://localhost:3000/api/test-db
```

Ekranda `"status": "success"` mesajını görüyorsanız kurulum tamamlanmıştır.

## Film ve dizi modülü

Komutları Node.js 24 ile, `package.json` dosyasının bulunduğu klasörde çalıştırabilirsiniz.

### Veritabanı ve oturum

Ortak Supabase veritabanı için 2. adımdaki `DATABASE_URL` değerini kullanın. Yerel bir PostgreSQL sunucusu kullanıyorsanız boş bir `streamfin` veritabanı oluşturun ve `.env.local` dosyasına kendi kullanıcı, parola ve port bilgilerinizi girin.

```env
DATABASE_URL="postgresql://[KULLANICI]:[PAROLA]@127.0.0.1:[PORT]/streamfin"
```

Bu bilgisayardaki geliştirme kopyasında veritabanı, şema ve `.env.local` hazırdır. PostgreSQL bilgisayar yeniden açıldıktan sonra kapalıysa, proje kökünde PowerShell ile başlatabilirsiniz. Veriler `.streamfin-local/data` içinde saklanır ve sunucu `127.0.0.1:55432` üzerinde çalışır.

```powershell
& '.\.streamfin-local\node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe' -D '.\.streamfin-local\data' -l '.\.streamfin-local\postgres.log' start
```

Yeni kurulumda oturum çerezlerini imzalamak için bir `JWT_SECRET` gerekir. Aşağıdaki komut eksikse rastgele bir anahtar üretip mevcut `.env.local` dosyasına ekler.

```bash
node --env-file=.env.local -e "if (!process.env.JWT_SECRET) require('node:fs').appendFileSync('.env.local','\nJWT_SECRET='+require('node:crypto').randomBytes(32).toString('hex')+'\n')"
```

Yeni ve **boş veritabanına** tabloları ve indeksleri kurun.

```bash
npx prisma db execute --file db/schema.sql
```

StreamFin tabloları zaten kuruluysa yalnızca modülün indeks geçişini uygulayın. Komutlar hedef veritabanını `.env.local` içindeki `DATABASE_URL` değerinden alır.

```bash
npx prisma db execute --file db/migrations/001_media_library_indexes.sql
```

Paketleri kurduktan sonra ve Prisma şeması değiştiğinde yerel Prisma istemcisini üretin.

```bash
npx prisma generate
```

### Canlı TMDB kataloğu

Canlı arama, yapım ayrıntıları ve sezon verileri için TMDB hesabınızdaki **API Read Access Token** değerini `.env.local` dosyasına ekleyin ve geliştirme sunucusunu yeniden başlatın. [TMDB API ayarları](https://www.themoviedb.org/settings/api)

```env
TMDB_READ_ACCESS_TOKEN="[TMDB_OKUMA_BELIRTECI]"
```

Bu alan boşken uygulama sekiz yapımlık yerel önizleme kataloğunu gösterir. Her iki katalogda da kişisel incelemeler ve izleme listeleri PostgreSQL’e kaydedilir. Önizlemedeki *Vezir Gambiti* görsellerinin kaynağı [TVmaze](https://www.tvmaze.com/shows/41428/the-queens-gambit).

### Modülü deneyin

1. `npm run dev` ile uygulamayı açın. Katalogda film veya dizi adına göre arama yapabilir, yapım türü ve birden fazla kategori seçebilirsiniz. [Film ve dizi kataloğu](http://localhost:3000/movies)
2. Bir hesap açın veya giriş yapın. Örneğin **Vezir Gambiti** sayfasında diziyi izleme listenize ekleyip durumunu **İzliyorum** olarak seçin. [Dizi ayrıntıları](http://localhost:3000/movies/tv/87739)
3. Dizinin kendisine, **1. Sezon** sayfasına ve ilk bölüm **Openings**’e ayrı ayrı 1–10 puan verin. İsterseniz puanla birlikte bir inceleme yazın. Her sayfada o içeriğin görünür topluluk değerlendirmeleri ve puan ortalaması yer alır. [İlk bölüm](http://localhost:3000/movies/tv/87739?season=1&episode=1)
4. **Arşivim** sayfasında kişisel kayıtlarınızı arayabilir, değerlendirmelerinizi düzenleyebilir, izleme durumunu değiştirebilir veya bir kaydı silebilirsiniz. [Kişisel arşiv](http://localhost:3000/movies/library)
