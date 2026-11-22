# StreamFin

Geliştirme sunucusu bilgisayarınızda çalışır ve ekibin ortak Supabase PostgreSQL veritabanına bağlanır. Yeni kurulum için Node.js 24 kullanın.

## 1. Repoyu Klonlayın ve Paketleri Kurun

```bash
git clone https://github.com/mehmetk0ksal/StreamFin
cd StreamFin
npm install
```

## 2. Ortak Supabase bağlantısını ve oturumu ayarlayın

Proje kökünde (`package.json` yanında) `.env.local` dosyasını açın veya oluşturun. Ekip projesinin **Session pooler** adresini kullanın. Yerel PostgreSQL’den geçiyorsanız geliştirme sunucusunu durdurun ve mevcut `DATABASE_URL` satırını değiştirin. Kendi `TMDB_READ_ACCESS_TOKEN` değerinizi ve diğer servis ayarlarınızı koruyun.

```env
DATABASE_URL="postgresql://postgres.uganboyysvshzqpmwbxk:[SIFRE]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

`[SIFRE]` yer tutucusunu köşeli parantezlerle birlikte ekibin veritabanı parolasıyla değiştirin. Yalnızca paroladaki özel karakterleri URL biçiminde kodlayın. Örneğin `@` için `%40`, `#` için `%23`, `%` için `%25` kullanın. Gerçek parolayı ve anahtarları kendi `.env.local` dosyanızda saklayın. Bu dosya Git tarafından dışlanır.

Uygulama oturum çerezlerini `JWT_SECRET` ile imzalar. Aynı veritabanıyla çalışmaya devam ediyorsanız mevcut anahtarınızı koruyun. **Farklı bir veritabanına geçiyorsanız** eski `JWT_SECRET` satırını `.env.local` dosyanızdan silin. İki veritabanında aynı kullanıcı numarası farklı kişilere ait olabilir. Anahtarı yenilemek eski çerezleri geçersiz kılar ve kullanıcılar yeniden giriş yapar.

Yeni klonda veya eski anahtarı sildikten sonra aşağıdaki komut rastgele bir anahtar üretip doğrudan `.env.local` dosyanıza ekler.

```bash
node --env-file=.env.local -e "if (process.env.JWT_SECRET === undefined) require('node:fs').appendFileSync('.env.local', '\nJWT_SECRET=' + require('node:crypto').randomBytes(32).toString('hex') + '\n')"
```

## 3. Sunucuyu Başlatın

`npm run dev`, Prisma istemcisini otomatik olarak üretir ve geliştirme sunucusunu başlatır. Çalışan sunucunun yeni bağlantıyı kullanması için `.env.local` değişikliğinden sonra yeniden başlatın.

```bash
npm run dev
```

Windows PowerShell `npm.ps1` dosyasını engelliyorsa ilk kurulumda `npm.cmd install`, sunucuyu başlatırken `npm.cmd run dev` kullanın.

## 4. Bağlantıyı ve tabloları doğrulayın

Sunucu çalışırken [bağlantı testini](http://localhost:3000/api/test-db) açın. `"status": "success"` ve `serverTime` görmeniz, uygulamanın yapılandırılmış veritabanında `SELECT NOW()` sorgusunu çalıştırabildiğini gösterir.

Tabloları ayrıca kontrol etmek için ekip projesinin Supabase SQL Editor ekranında aşağıdaki salt okunur sorguyu çalıştırın. Her satırın `bulunan_tablo` sütununda bir tablo adı görünmelidir. Bu sütunda `NULL` varsa eksik tabloyu ekiple paylaşın. Ortak veritabanının şema ve indeks değişikliklerini ekip birlikte planlar.

```sql
SELECT ad, to_regclass('public.' || ad) AS bulunan_tablo
FROM (VALUES ('roles'), ('users'), ('playlists'), ('playlist_tracks'),
             ('media_reviews'), ('watchlists'), ('saved_videos'), ('moderation_logs')) AS tablolar(ad)
ORDER BY ad;
```

## Film ve dizi modülü

### Canlı TMDB kataloğu

Canlı arama, yapım ayrıntıları ve sezon verileri için TMDB hesabınızdaki **API Read Access Token** değerini `.env.local` dosyasına ekleyin ve geliştirme sunucusunu yeniden başlatın. [TMDB API ayarları](https://www.themoviedb.org/settings/api)

```env
TMDB_READ_ACCESS_TOKEN="[TMDB_OKUMA_BELIRTECI]"
```

Bu alan boşken uygulama sekiz yapımlık yerel önizleme kataloğunu gösterir. Her iki katalogda da kişisel incelemeler ve izleme listeleri PostgreSQL’e kaydedilir. Önizlemedeki *Vezir Gambiti* görsellerinin kaynağı [TVmaze](https://www.tvmaze.com/shows/41428/the-queens-gambit).

### Modülü deneyin

1. Katalogda film veya dizi adına göre arama yapabilir, yapım türü ve birden fazla kategori seçebilirsiniz. [Film ve dizi kataloğu](http://localhost:3000/movies)
2. Bir hesap açın veya giriş yapın. Örneğin **Vezir Gambiti** sayfasında diziyi izleme listenize ekleyip durumunu **İzliyorum** olarak seçin. [Dizi ayrıntıları](http://localhost:3000/movies/tv/87739)
3. Dizinin kendisine, **1. Sezon** sayfasına ve ilk bölüm **Openings**’e ayrı ayrı 1–10 puan verin. İsterseniz puanla birlikte bir inceleme yazın. Her sayfada o içeriğin görünür topluluk değerlendirmeleri ve puan ortalaması yer alır. [İlk bölüm](http://localhost:3000/movies/tv/87739?season=1&episode=1)
4. **Arşivim** sayfasında kişisel kayıtlarınızı arayabilir, değerlendirmelerinizi düzenleyebilir, izleme durumunu değiştirebilir veya bir kaydı silebilirsiniz. [Kişisel arşiv](http://localhost:3000/movies/library)

## İsteğe bağlı yerel PostgreSQL

Kendi veritabanınızda bağımsız çalışmak isterseniz `.env.local` içindeki `DATABASE_URL` için yerel bağlantınızı kullanın. Ortak veritabanından geçiyorsanız 2. adımdaki oturum anahtarını yenileme işlemini uygulayın. Ardından geliştirme sunucusunu yeniden başlatın. Bu veritabanındaki kayıtlar yerel diskinizde kalır.

```env
DATABASE_URL="postgresql://[KULLANICI]:[PAROLA]@127.0.0.1:[PORT]/streamfin"
```

Önceden kurulmuş gömülü Windows veritabanını kullanıyorsanız veriler `.streamfin-local/data` içindedir ve port `55432`’dir. Kapalıysa proje kökünde PowerShell ile başlatabilirsiniz.

```powershell
& '.\.streamfin-local\node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe' -D '.\.streamfin-local\data' -l '.\.streamfin-local\postgres.log' start
```

Sıfırdan yerel kurulum için önce boş bir `streamfin` veritabanı oluşturun. `DATABASE_URL` değerinin bu boş **yerel** veritabanını gösterdiğini doğruladıktan sonra tabloları ve indeksleri bir kez kurun.

```bash
npx prisma db execute --file db/schema.sql
```
