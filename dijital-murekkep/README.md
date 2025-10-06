# Dijital Mürekkep - Çizim Programı

Bu proje, [tldraw](https://github.com/tldraw/tldraw) SDK'sini kullanarak geliştirilmiş modern bir çizim uygulamasıdır.

## Özellikler

- Sonsuz canvas üzerinde çizim
- Çeşitli çizim araçları (kalem, şekiller, metin, vb.)
- **Dışa Aktarma**: PNG ve SVG formatlarında kaydetme
- **Mobil ve Dokunmatik Destek**: Tablet ve telefonlarda optimize edilmiş deneyim
- Gerçek zamanlı işbirliği desteği
- Responsive tasarım
- TypeScript desteği
- Kullanıcı bildirim sistemi

## Teknoloji Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Canvas Library**: tldraw SDK
- **Styling**: CSS Modules

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev

# Build için
npm run build
```

## Kullanım

Uygulama tarayıcınızda `localhost:5173` adresinde çalışacaktır. tldraw'ın tüm özelliklerini kullanabilirsiniz:

### Temel Çizim Araçları
- Çizim araçları (pen, highlighter, eraser)
- Şekil araçları (rectangle, ellipse, arrow, line)
- Metin ekleme
- Renk seçimi
- Zoom ve pan işlemleri

<!-- Katman yönetimi kaldırıldı -->

### Dışa Aktarma
- **PNG**: Çiziminizi PNG formatında kaydedin
- **SVG**: Çiziminizi SVG formatında kaydedin (vektörel)
 
 ### Menü (☰)
 - **💾 Kaydet (.sdm)**: Çalışmayı özel .sdm formatında indirin
 - **📂 Dosya Aç (.sdm)**: Daha önce kaydedilmiş .sdm dosyasını yükleyin
 - **🧾 PDF Olarak Dışa Aktar**: Çalışmanızı PDF olarak indirin

Tüm işlemler için kullanıcı bildirimleri gösterilir.

### Mobil Kullanım
Mobil ve tablet cihazlarda:
- Araç çubuğu ekranın altında konumlandırılır
- Dokunmatik dostu büyük butonlar kullanılır
- İkon tabanlı hızlı erişim
- Dokunmatik kaydırma ve zoom desteği
- Katman yönetimi paneli gizlenir (sadece temel işlemler)

## Changelog

Detaylı değişiklik geçmişi için [CHANGELOG.md](../CHANGELOG.md) dosyasını inceleyin.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
