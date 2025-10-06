# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Biçim [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına uygun olarak tutulmaktadır.

## [1.0.0] - 2025-10-06

### Added
- Temel React projesi kurulumu (Vite + TypeScript)
- tldraw SDK entegrasyonu
- Temel çizim uygulaması oluşturuldu
- Proje dokümantasyonu (README.md) eklendi

### Dependencies
- tldraw@^4.0.3 eklendi

## [1.5.0] - 2025-10-06

### Added
- Hamburger menü: Kaydet (.sdm), Dosya Aç (.sdm), PDF dışa aktarma
- PDF dışa aktarma için jsPDF entegrasyonu
 - Default tldraw “Dosya” menüsüne override ile buton entegrasyonu

### Removed
- Katman özelliği tamamen kaldırıldı (panel, görünürlük, grup/öne/arkaya işlemleri)

### Changed
- UI sadeleştirildi, yalnızca çizim ve dışa aktarma yetenekleri + menü

### Fixed
- useEditor hatası giderildi: LayerPanel kaldırıldığı için konteks hatası oluşmaz

### Fixed
- useEditor hatası giderildi: LayerPanel Tldraw içine taşındı ve locale="en" ayarlandı

## [1.2.0] - 2025-10-06

### Added
- Mobil ve dokunmatik cihaz desteği
- Responsive tasarım iyileştirmeleri
- Mobil cihazlarda alt konumlandırılmış araç çubuğu
- Dokunmatik dostu buton tasarımı
- Mobil meta tag'leri (viewport, PWA desteği)
- Dokunmatik olay optimizasyonları

### Features
- Otomatik mobil cihaz tespiti
- Mobil cihazlarda ikon tabanlı UI
- Dokunmatik kaydırma iyileştirmeleri
- Mobil-first responsive tasarım

## [1.1.0] - 2025-10-06

### Added
- Katman yönetimi sistemi (grup oluşturma/açma, öne/arkaya gönderme)
- PNG/SVG dışa aktarma özelliği
- Özel araç çubuğu UI bileşeni
- Kullanıcı bildirim sistemi (toast mesajları)

### Features
- Çoklu şekil seçimi ve gruplandırma
- Z-index yönetimi (katman sıralaması)
- Dosya dışa aktarma (PNG ve SVG formatları)

## [1.9.0] - 2025-10-06

### Added
- Layer panel toggle butonu: toolbar'dan layer panel'i açıp kapatma
- Layer panel genişlik ayarı: sağ kenardan sürükleyerek genişlik değiştirme
- Draggable resize handle: sağ kenarda mavi resize göstergesi

### Features
- Layer panel toggle: toolbar'daki "Layer Panel'i Göster/Gizle" butonu
- Dynamic genişlik: 150px-400px arası draggable resize
- Resize feedback: sürükleme sırasında cursor değişikliği
- Smooth transitions: genişlik değişikliğinde akıcı animasyon


## [Unreleased]
