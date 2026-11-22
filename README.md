# StreamFin

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları sırasıyla uygulayın.

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