# MEMUR JARGONU WEB - KAPSAMLI PROJE RAPORU

## 1. PROJE GENEL BİLGİLERİ

### 1.1. Proje Adı

**MEMUR JARGONU** - KPSS ve AGS Hazırlık Platformu

### 1.2. Teknoloji Stack

- **Framework**: Next.js 15.5.2 (Pages Router)
- **UI Framework**: React 19.1.0
- **Styling**: Tailwind CSS 4, Bootstrap Icons
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Admin SDK**: Firebase Admin SDK 13.5.0
- **Ödeme Entegrasyonu**: PayTR
- **Form Yönetimi**: React Hook Form + Zod
- **Bildirimler**: React Toastify
- **Dosya İşleme**: Formidable, XLSX
- **Cloud Storage**: Google Cloud Storage
- **Dil**: TypeScript 5

## 2. ENTEGRASYONLAR

### 2.1. Firebase Entegrasyonu

#### 2.1.1. Firebase Authentication

- **Email/Password Authentication**: Kullanıcı girişi
- **Google Sign-In**: OAuth ile Google hesabı ile giriş
- **Custom Claims**: Admin yetkileri ve premium durumu için
- **Token Yönetimi**: Token cache mekanizması (`tokenCache.ts`)
- **Dosya**: `src/lib/firebase.ts`

#### 2.1.3. Firebase Storage

- PDF dosyaları için depolama
- Google Cloud Storage entegrasyonu
- Dosya yükleme ve indirme işlemleri

#### 2.1.4. Firebase Admin SDK

- Server-side işlemler için
- Custom claims yönetimi
- Kullanıcı yönetimi

### 2.2. PayTR Ödeme Entegrasyonu

#### 2.2.1. Özellikler

- **Test Modu**: Aktif (test_mode: 1)
- **Taksit**: Kapalı (no_installment: 1)
- **Hash Doğrulama**: SHA256 HMAC ile güvenli ödeme
- **Callback İşleme**: Asenkron ödeme bildirimleri

#### 2.2.2. API Endpoints

- **Checkout**: `/api/checkout` - Ödeme token'ı oluşturma
- **Callback**: `/api/payment/callback` - PayTR'den gelen bildirimler

#### 2.2.3. Ödeme Akışı

1. Kullanıcı sepeti doldurur
2. `/api/checkout` endpoint'ine istek gönderilir
3. PayTR API'den token alınır
4. Kullanıcı PayTR sayfasına yönlendirilir
5. Ödeme sonrası callback endpoint'i çağrılır
6. Sipariş durumu güncellenir
7. Kullanıcı paketleri aktif edilir
8. Custom claims güncellenir

### 2.3. Google Cloud Storage

- Firebase Storage üzerinden erişim
- PDF dosya yükleme
- Dosya boyutu ve metadata yönetimi

---

## 3. KULLANICI SAYFALARI

### 3.1. Ana Sayfa (`/`)

- Hero section
- Özellikler bölümü
- Premium avantajları tanıtımı
- Header ve Footer bileşenleri

### 3.2. Giriş Sayfası (`/login`)

- Email/Password girişi
- Google Sign-In entegrasyonu
- Admin/kullanıcı yönlendirmesi
- Form validasyonu

### 3.3. Paketler Sayfası (`/plans`)

- Aktif paketlerin listelenmesi
- Kullanıcının sahip olduğu paketlerin gösterimi
- Sepete ekleme işlevi
- Aylık fiyat hesaplama
- Paket özellikleri gösterimi

### 3.4. Sepet Sayfası (`/cart`)

- Sepet içeriği görüntüleme
- Ödeme işlemi başlatma
- Sepet yönetimi (ekleme/çıkarma)

### 3.5. Profil Sayfası (`/profile`)

- Kullanıcı bilgileri
- Paket durumları
- Premium durumu

### 3.6. İçerikler Sayfası (`/icerikler`)

- Tüm deneme türlerinin listesi
- Deneme sayıları ve istatistikler
- Kategori bazlı filtreleme
- Her deneme türü için detay sayfasına yönlendirme

### 3.7. Deneme Sayfaları (İSTEK ÜZERİNE ŞU AN DEAKTİF, SONRAKİ SÜREÇTE DEĞERLENDİRİLECEK.)

#### 3.7.1. Mevzuat Denemeleri (`/denemeler`)

- Deneme listesi
- Deneme detay sayfası (`/denemeler/[denemeId]`)

#### 3.7.2. Coğrafya Denemeleri (`/cografya-denemeler`)

- Deneme listesi
- Deneme detay sayfası (`/cografya-denemeler/[denemeId]`)

#### 3.7.3. Tarih Denemeleri (`/tarih-denemeler`)

- Deneme listesi
- Deneme detay sayfası (`/tarih-denemeler/[denemeId]`)

#### 3.7.4. Genel Denemeler (`/genel-denemeler`)

- Deneme listesi
- Deneme detay sayfası (`/genel-denemeler/[denemeId]`)

#### 3.7.5. Doğru-Yanlış Denemeleri (`/dogru-yanlis`)

- Deneme listesi
- Deneme detay sayfası (`/dogru-yanlis/[denemeId]`)

#### 3.7.6. Boşluk Doldurma Denemeleri (`/bosluk-doldurma`)

- Deneme listesi
- Deneme detay sayfası (`/bosluk-doldurma/[denemeId]`)

### 3.8. Ödeme Sayfaları

- **Başarılı Ödeme**: `/payment/success`
- **Başarısız Ödeme**: `/payment/fail`

### 3.9. 404 Sayfası (`/404`)

- Özel 404 sayfası

---

## 4. ADMIN PANELİ

### 4.1. Admin Giriş Kontrolü

- **Component**: `AdminGuard`
- **Hook**: `useAuthClaims`
- Custom claims ile admin kontrolü
- Otomatik yönlendirme

### 4.2. Admin Ana Sayfa (`/admin`)

- Dashboard görünümü
- Hızlı erişim kartları:
  - Plan Yönetimi
  - Kullanıcı Yönetimi
  - Sipariş Yönetimi
  - İçerik Yönetimi
  - Zamanlı Sınav Yönetimi
  - Ders Programları
  - Düello Yönetimi
  - Problem Raporları

### 4.3. Plan Yönetimi (`/admin/plans`)

- Plan listesi görüntüleme
- Yeni plan ekleme
- Plan düzenleme
- Plan silme
- Plan aktif/pasif yapma
- Fiyat güncelleme
- Paket sistemi bilgileri

### 4.4. Kullanıcı Yönetimi (`/admin/users`)

- Kullanıcı listesi (pagination ile)
- Kullanıcı arama (email, nickname, UID)
- Premium filtreleme
- Kullanıcı düzenleme:
  - Email
  - Forum nickname
  - Premium durumu
  - Engelleme durumu
- Paket yönetimi (modal ile)
- Premium ver/kaldır işlemleri
- Kullanıcı engelleme/kaldırma

### 4.5. Sipariş Yönetimi (`/admin/orders`)

- Sipariş listesi
- Sipariş durumları
- Ödeme bilgileri

### 4.6. Denemeler Yönetimi (`/admin/denemeler-yonetimi`)

- Tab bazlı deneme türleri:
  - Mevzuat Denemeleri
  - Coğrafya Denemeleri
  - Tarih Denemeleri
  - Genel Denemeler
- Deneme oluşturma
- Deneme listesi
- Deneme silme

### 4.7. Soru Yönetimi Sayfaları

#### 4.7.1. Mevzuat Soruları (`/admin/denemeler/[denemeId]/sorular`)

- Soru listesi
- Soru ekleme/düzenleme/silme
- Excel import

#### 4.7.2. Coğrafya Soruları (`/admin/cografya-denemeler/[denemeId]/sorular`)

- Soru yönetimi

#### 4.7.3. Tarih Soruları (`/admin/tarih-denemeler/[denemeId]/sorular`)

- Soru yönetimi

#### 4.7.4. Genel Deneme Soruları (`/admin/genel-denemeler/[denemeId]/sorular`)

- Soru yönetimi

#### 4.7.5. Doğru-Yanlış Soruları (`/admin/dogru-yanlis/[denemeId]/sorular`)

- Soru yönetimi
- Collection yönetimi

#### 4.7.6. Boşluk Doldurma Soruları (`/admin/bosluk-doldurma/[denemeId]/sorular`)

- Soru yönetimi
- Collection yönetimi

### 4.8. İçerik Yönetimi

#### 4.8.1. PDF Yönetimi (`/admin/content/pdf-management`)

- PDF kategorileri görüntüleme
- Kategori bazlı istatistikler
- PDF listesi görüntüleme
- PDF ekleme sayfası

#### 4.8.2. PDF Ekleme (`/admin/content/add-pdf`)

- PDF dosya yükleme
- Kategori seçimi
- Paket ilişkilendirme
- Metadata ekleme

#### 4.8.3. PDF Listesi (`/admin/content/list`)

- Filtrelenmiş PDF listesi
- Arama ve sıralama
- PDF düzenleme/silme

#### 4.8.4. PDF Soruları (`/admin/content/pdfs/[pdfId]/questions`)

- PDF'e bağlı sorular

### 4.9. Zamanlı Sınav Yönetimi (`/admin/timed-exams`)

- Sınav listesi
- Yeni sınav oluşturma
- Sınav silme
- Sınav istatistikleri:
  - Toplam sınav sayısı
  - Aktif sınav sayısı
  - Toplam katılımcı
  - Ortalama puan
- Filtreleme (tümü, aktif, yaklaşan, tamamlanan)
- Sınav durumu takibi

#### 4.9.1. Sınav Sıralaması (`/admin/timed-exams/[examId]/rankings`)

- Katılımcı sıralaması
- Puan dağılımı
- Detaylı istatistikler

#### 4.9.2. Sınav Dashboard (`/admin/timed-exams/dashboard`)

- Gerçek zamanlı izleme
- Canlı istatistikler

### 4.10. Ders Programları (`/admin/study-programs`)

- Program listesi
- Program oluşturma/düzenleme
- Program detay sayfası (`/admin/study-programs/[programId]`)

### 4.11. Düello Yönetimi (`/admin/duello-questions`)

- Düello soruları yönetimi
- Soru ekleme/düzenleme

### 4.12. Eşleştirmeler (`/admin/eslestirmeler`)

- Eşleştirme içerikleri
- İçerik detay sayfası (`/admin/eslestirmeler/[docId]`)

### 4.13. Eğitim Videoları (`/admin/egitim-videolari`)

- Video listesi
- Video ekleme/düzenleme
- Video detay sayfası (`/admin/egitim-videolari/[docId]`)

### 4.14. Problem Raporları (`/admin/problem-reports`)

- Kullanıcı problem raporları
- Durum yönetimi

### 4.15. PDF Dosyaları (Eski Sistem) (`/admin/pdf-files`)

- PDF dosya listesi
- Yeni PDF ekleme (`/admin/pdf-files/new`)
- PDF detay (`/admin/pdf-files/[docId]`)
- PDF soruları (`/admin/pdf-files/[docId]/questions`)

### 4.16. Admin Kurtarma (`/admin/recover`)

- Acil durum admin yetkisi kurtarma

---

## 5. API ROUTES

### 5.1. Kullanıcı API'leri

#### 5.1.1. Profil API

- `GET /api/profile/packages` - Kullanıcının paketlerini getir

### 5.2. Deneme API'leri

#### 5.2.1. Mevzuat Denemeleri

- `GET /api/denemeler/list` - Deneme listesi
- `GET /api/denemeler/[denemeId]/sorular` - Deneme soruları

#### 5.2.2. Coğrafya Denemeleri

- `GET /api/cografya-denemeler/list` - Deneme listesi
- `GET /api/cografya-denemeler/[denemeId]/sorular` - Deneme soruları

#### 5.2.3. Tarih Denemeleri

- `GET /api/tarih-denemeler/list` - Deneme listesi
- `GET /api/tarih-denemeler/[denemeId]/sorular` - Deneme soruları

#### 5.2.4. Genel Denemeler

- `GET /api/genel-denemeler/list` - Deneme listesi
- `GET /api/genel-denemeler/[denemeId]/sorular` - Deneme soruları

#### 5.2.5. Doğru-Yanlış Denemeleri

- `GET /api/dogru-yanlis/list` - Deneme listesi
- `GET /api/dogru-yanlis/[denemeId]/sorular` - Deneme soruları
- `GET /api/dogru-yanlis/[denemeId]/collections` - Collection listesi

#### 5.2.6. Boşluk Doldurma Denemeleri

- `GET /api/bosluk-doldurma/list` - Deneme listesi
- `GET /api/bosluk-doldurma/[denemeId]/sorular` - Deneme soruları

### 5.3. Ödeme API'leri

- `POST /api/checkout` - Ödeme token'ı oluştur
- `POST /api/payment/callback` - PayTR callback işleme

### 5.4. Admin API'leri

#### 5.4.1. Kullanıcı Yönetimi

- `GET /api/admin/users/list` - Kullanıcı listesi (pagination)
- `POST /api/admin/users/edit` - Kullanıcı düzenle
- `POST /api/admin/users/block` - Kullanıcı engelle/kaldır
- `POST /api/admin/users/premium` - Premium ver/kaldır
- `GET /api/admin/users/packages/list` - Kullanıcı paketleri
- `POST /api/admin/users/packages/add` - Paket ekle
- `POST /api/admin/users/packages/extend` - Paket uzat
- `POST /api/admin/users/packages/remove` - Paket kaldır

#### 5.4.2. Deneme Yönetimi

- `POST /api/admin/denemeler/create` - Deneme oluştur
- `DELETE /api/admin/denemeler/delete` - Deneme sil
- `GET /api/admin/denemeler/[denemeId]/sorular` - Soru listesi
- `POST /api/admin/denemeler/[denemeId]/sorular` - Soru ekle
- `PUT /api/admin/denemeler/[denemeId]/sorular/[soruId]` - Soru güncelle
- `DELETE /api/admin/denemeler/[denemeId]/sorular/[soruId]` - Soru sil
- `POST /api/admin/denemeler/backfill` - Backfill işlemi
- `POST /api/admin/denemeler/backfill-sorular` - Soru backfill
- `POST /api/admin/denemeler/backfill-all-sorular` - Tüm sorular backfill

#### 5.4.3. Coğrafya Denemeleri

- `POST /api/admin/cografya-denemeler/create` - Deneme oluştur
- `DELETE /api/admin/cografya-denemeler/delete` - Deneme sil

#### 5.4.4. Tarih Denemeleri

- `POST /api/admin/tarih-denemeler/create` - Deneme oluştur
- `DELETE /api/admin/tarih-denemeler/delete` - Deneme sil

#### 5.4.5. Genel Denemeler

- `POST /api/admin/genel-denemeler/create` - Deneme oluştur
- `DELETE /api/admin/genel-denemeler/delete` - Deneme sil
- `GET /api/admin/genel-denemeler/[denemeId]/sorular` - Soru listesi
- `POST /api/admin/genel-denemeler/[denemeId]/sorular` - Soru ekle
- `PUT /api/admin/genel-denemeler/[denemeId]/sorular/[soruId]` - Soru güncelle
- `DELETE /api/admin/genel-denemeler/[denemeId]/sorular/[soruId]` - Soru sil
- `POST /api/admin/genel-denemeler/backfill` - Backfill işlemi

#### 5.4.6. Doğru-Yanlış Denemeleri

- `POST /api/admin/dogru-yanlis/create` - Deneme oluştur
- `DELETE /api/admin/dogru-yanlis/delete` - Deneme sil
- `PUT /api/admin/dogru-yanlis/update` - Deneme güncelle
- `POST /api/admin/dogru-yanlis/backfill` - Backfill işlemi
- `GET /api/admin/dogru-yanlis/[denemeId]/sorular` - Soru listesi
- `POST /api/admin/dogru-yanlis/[denemeId]/sorular` - Soru ekle
- `PUT /api/admin/dogru-yanlis/[denemeId]/sorular/[soruId]` - Soru güncelle
- `DELETE /api/admin/dogru-yanlis/[denemeId]/sorular/[soruId]` - Soru sil
- `GET /api/admin/dogru-yanlis/[denemeId]/collections` - Collection listesi
- `GET /api/admin/dogru-yanlis/[denemeId]/collections/[collectionId]` - Collection detay
- `POST /api/admin/dogru-yanlis/[denemeId]/collections` - Collection oluştur
- `PUT /api/admin/dogru-yanlis/[denemeId]/collections/[collectionId]` - Collection güncelle
- `DELETE /api/admin/dogru-yanlis/[denemeId]/collections/[collectionId]` - Collection sil

#### 5.4.7. Boşluk Doldurma Denemeleri

- `POST /api/admin/bosluk-doldurma/create` - Deneme oluştur
- `DELETE /api/admin/bosluk-doldurma/delete` - Deneme sil
- `GET /api/admin/bosluk-doldurma/[denemeId]/sorular` - Soru listesi
- `POST /api/admin/bosluk-doldurma/[denemeId]/sorular` - Soru ekle
- `PUT /api/admin/bosluk-doldurma/[denemeId]/sorular/[soruId]` - Soru güncelle
- `DELETE /api/admin/bosluk-doldurma/[denemeId]/sorular/[soruId]` - Soru sil
- `GET /api/admin/bosluk-doldurma/[denemeId]/collections` - Collection listesi
- `GET /api/admin/bosluk-doldurma/[denemeId]/collections/[collectionId]` - Collection detay
- `POST /api/admin/bosluk-doldurma/[denemeId]/collections` - Collection oluştur
- `PUT /api/admin/bosluk-doldurma/[denemeId]/collections/[collectionId]` - Collection güncelle
- `DELETE /api/admin/bosluk-doldurma/[denemeId]/collections/[collectionId]` - Collection sil

#### 5.4.8. İçerik Yönetimi

- `GET /api/admin/content/list` - PDF listesi
- `GET /api/admin/content/stats` - PDF istatistikleri
- `POST /api/admin/content/upload` - Dosya yükleme
- `POST /api/admin/content/upload-file` - Dosya yükleme (alternatif)
- `POST /api/admin/content/create-pdf` - PDF oluştur
- `PUT /api/admin/content/[action]` - PDF güncelle (update)
- `DELETE /api/admin/content/[action]` - PDF sil (delete)
- `PATCH /api/admin/content/[action]` - PDF durum değiştir (status)
- `GET /api/admin/content/pdfs/[pdfId]` - PDF detay
- `GET /api/admin/content/pdfs/[pdfId]/questions` - PDF soruları

#### 5.4.9. PDF Dosyaları (Eski Sistem)

- `GET /api/admin/pdf-files/list` - PDF listesi
- `POST /api/admin/pdf-files/create` - PDF oluştur
- `GET /api/admin/pdf-files/[docId]` - PDF detay
- `GET /api/admin/pdf-files/[docId]/questions` - PDF soruları

#### 5.4.10. Zamanlı Sınavlar

- `GET /api/admin/timed-exams/list` - Sınav listesi
- `POST /api/admin/timed-exams/create` - Sınav oluştur
- `DELETE /api/admin/timed-exams/delete` - Sınav sil
- `GET /api/admin/timed-exams/stats` - Sınav istatistikleri
- `GET /api/admin/timed-exams/[examId]/rankings` - Sınav sıralaması

#### 5.4.11. Ders Programları

- `GET /api/admin/study-programs/list` - Program listesi
- `POST /api/admin/study-programs/create` - Program oluştur
- `GET /api/admin/study-programs/[programId]` - Program detay
- `PUT /api/admin/study-programs/[programId]` - Program güncelle
- `DELETE /api/admin/study-programs/[programId]` - Program sil

#### 5.4.12. Düello Soruları

- `GET /api/admin/duello-questions` - Soru listesi
- `POST /api/admin/duello-questions` - Soru ekle/güncelle

#### 5.4.13. Eşleştirmeler

- `GET /api/admin/eslestirmeler/list` - Eşleştirme listesi
- `POST /api/admin/eslestirmeler/create` - Eşleştirme oluştur
- `GET /api/admin/eslestirmeler/[docId]` - Eşleştirme detay

#### 5.4.14. Eğitim Videoları

- `GET /api/admin/egitim-videolari/list` - Video listesi
- `POST /api/admin/egitim-videolari/create` - Video oluştur
- `GET /api/admin/egitim-videolari/[docId]` - Video detay
- `GET /api/admin/egitim-videolari/[docId]/videos` - Video içerikleri

#### 5.4.15. Problem Raporları

- `GET /api/admin/problem-reports` - Rapor listesi
- `PATCH /api/admin/problem-reports/status` - Rapor durumu güncelle

### 5.5. Utility API'leri

- `GET /api/hello` - Test endpoint
- `GET /api/ping` - Health check

### 5.6. Webhook API'leri

- `POST /api/webhooks/mock` - Mock webhook test

---

## 6. COMPONENTLER

### 6.1. Layout Componentleri

- **Header** (`src/components/Header.tsx`): Ana navigasyon, kullanıcı bilgileri, sepet ikonu
- **Footer** (`src/components/Footer.tsx`): Sayfa alt bilgisi
- **Breadcrumb** (`src/components/Breadcrumb.tsx`): Sayfa yolu gösterimi

### 6.2. Admin Componentleri

- **AdminGuard** (`src/components/AdminGuard.tsx`): Admin yetki kontrolü
- **AdminDenemeTable** (`src/components/AdminDenemeTable.tsx`): Deneme tablosu
- **QuestionsManagement** (`src/components/admin/QuestionsManagement.tsx`): Soru yönetimi
- **CreateTimedExamModal** (`src/components/admin/CreateTimedExamModal.tsx`): Zamanlı sınav oluşturma modalı
- **AdminSorularPage** (`src/components/admin/AdminSorularPage.tsx`): Soru sayfası

### 6.3. Form Componentleri

- **CreateDenemeModal** (`src/components/CreateDenemeModal.tsx`): Deneme oluşturma modalı
- **ExcelImportModal** (`src/components/ExcelImportModal.tsx`): Excel import modalı
- **PackageManager** (`src/components/PackageManager.tsx`): Paket yönetimi modalı

### 6.4. UI Componentleri

- **LoadingSpinner** (`src/components/LoadingSpinner.tsx`): Yükleme göstergesi
- **Alert** (`src/components/Alert.tsx`): Bildirim mesajları
- **ConfirmModal** (`src/components/ConfirmModal.tsx`): Onay modalı
- **CustomModal** (`src/components/CustomModal.tsx`): Özel modal
- **Pagination** (`src/components/Pagination.tsx`): Sayfalama bileşeni

### 6.5. İçerik Componentleri

- **DenemeList** (`src/components/DenemeList.tsx`): Deneme listesi
- **SoruList** (`src/components/SoruList.tsx`): Soru listesi

---

## 7. SERVİSLER

### 7.1. Deneme Servisi (`src/services/denemeService.ts`)

- Deneme CRUD işlemleri
- Soru yönetimi
- Firestore entegrasyonu

### 7.2. Paket Servisi (`src/services/packageService.ts`)

- Paket ekleme/çıkarma
- Paket süre uzatma
- Kullanıcı paket durumu yönetimi
- Legacy premium uyumluluğu

### 7.3. PDF Servisi (`src/services/pdfService.ts`)

- PDF CRUD işlemleri
- Dosya yükleme
- Kategori yönetimi
- İstatistik hesaplama

---

## 8. TİP TANIMLARI

### 8.1. Paket Tipleri (`src/types/package.ts`)

- `PackageType`: Enum - Tüm paket türleri (KPSS, AGS)
- `PackageCategory`: Enum - Paket kategorileri
- `UserData`: Interface - Kullanıcı veri yapısı
- `PackageOperationResult`: Interface - İşlem sonuçları

### 8.2. Deneme Tipleri (`src/types/deneme.ts`)

- `Deneme`: Interface - Deneme yapısı
- `Soru`: Interface - Soru yapısı
- `DenemeType`: Type - Deneme türleri
- `DENEME_COLLECTIONS`: Const - Firestore koleksiyon isimleri
- `DENEME_API_ENDPOINTS`: Const - API endpoint'leri

### 8.3. Zamanlı Sınav Tipleri (`src/types/timedExam.ts`)

- `TimedExam`: Interface - Sınav yapısı
- `TimedExamQuestion`: Interface - Soru yapısı
- `TimedExamRanking`: Interface - Sıralama yapısı
- `TimedExamStats`: Interface - İstatistikler

### 8.4. PDF Tipleri (`src/types/pdf.ts`)

- `PDFCategory`: Enum - Ana kategoriler
- `PDFSubcategory`: Enum - Alt kategoriler
- `PDFStatus`: Enum - Durumlar
- `PDFDocument`: Interface - PDF doküman yapısı
- `PDFStats`: Interface - İstatistikler

### 8.5. Plan Tipleri (`src/types/plan.ts`)

- `Plan`: Interface - Plan yapısı

---

## 9. CONSTANTS

### 9.1. Paket Sabitleri (`src/constants/packages.ts`)

- `PACKAGE_INFO`: Tüm paket bilgileri
- `PACKAGE_CATEGORIES`: Kategoriye göre paketler
- `DURATION_OPTIONS`: Süre seçenekleri
- Helper fonksiyonlar

### 9.2. PDF Kategorileri (`src/constants/pdfCategories.ts`)

- `PDF_CATEGORY_INFO`: Kategori bilgileri
- Helper fonksiyonlar

### 9.3. Deneme Routing (`src/utils/denemeRouting.ts`)

- `DENEME_ROUTE_CONFIGS`: Route konfigürasyonları
- Helper fonksiyonlar

---

## 10. CONTEXT API

### 10.1. Sepet Context (`src/context/CartContext.tsx`)

- Sepet state yönetimi
- LocalStorage entegrasyonu
- Sepet işlemleri (ekle, çıkar, temizle)

---

## 11. HOOKS

### 11.1. Auth Claims Hook (`src/hooks/useAuthClaims.ts`)

- Custom claims yönetimi
- Admin kontrolü
- Premium kontrolü

---

## 12. UTILITIES

### 12.1. Token Cache (`src/utils/tokenCache.ts`)

- Token cache mekanizması
- Token yenileme

### 12.2. Format Utilities

- `formatDate.ts`: Tarih formatlama
- `formatTime.ts`: Zaman formatlama

### 12.3. Paket Utilities (`src/utils/packageUtils.ts`)

- Paket süre hesaplama
- Paket durumu kontrolü
- Legacy uyumluluk fonksiyonları

---

## 13. GÜVENLİK ÖZELLİKLERİ

### 13.1. Authentication

- Firebase Authentication
- Google OAuth
- Custom Claims (Admin, Premium)
- Token doğrulama

### 13.2. Authorization

- Admin Guard component
- API endpoint'lerinde admin kontrolü
- Custom claims kontrolü

### 13.3. Ödeme Güvenliği

- PayTR hash doğrulama
- Sipariş durumu kontrolü
- Transaction kullanımı

### 13.4. Veri Güvenliği

- Firestore Security Rules (önerilir)
- Server-side validasyon
- Input sanitization

---

## 14. ÖZELLİKLER

### 14.1. Paket Sistemi

- **Sistem**: `ownedPackages`, `packageExpiryDates`
- **Uyumluluk**: Her iki sistem birlikte çalışır
- **Paket Türleri**:
  - KPSS: Full, Güncel, Tarih, Vatandaşlık, Coğrafya
  - AGS: Full, Mevzuat, Eğitim Temelleri, Coğrafya, Tarih

### 14.2. Deneme Sistemi

- 6 farklı deneme türü
- Soru yönetimi
- Excel import desteği
- Collection yönetimi (Doğru-Yanlış, Boşluk Doldurma)

### 14.3. Zamanlı Sınav Sistemi

- Sınav oluşturma
- Gerçek zamanlı izleme
- Sıralama sistemi
- İstatistikler

### 14.4. PDF Yönetimi

- Kategori bazlı organizasyon
- Paket ilişkilendirme
- Premium kontrolü
- Dosya yükleme

### 14.5. Kullanıcı Yönetimi

- Pagination
- Arama ve filtreleme
- Paket yönetimi
- Premium işlemleri

---

---

## 17. ÖNEMLİ NOTLAR

### 17.1. Test Modu

- PayTR test modu aktif (`test_mode: 1`)
- Production'a geçerken değiştirilmeli

### 17.2. Service Account

- Local development için `service-account.json` kullanılabilir
- Production için environment variable kullanılmalı

### 17.3. Custom Claims

- Admin yetkileri custom claims ile yönetiliyor
- Premium durumu hem custom claims hem Firestore'da tutuluyor
- Token refresh gerekebilir

### 17.4. Paket Sistemi Geçişi

- Legacy uyumluluk fonksiyonları mevcut
- KPSS_FULL paketi hem `isPremium` hem yeni sistemde aktif

## 20. SONUÇ

Bu proje, KPSS ve AGS hazırlık için kapsamlı bir eğitim platformudur. Firebase backend, PayTR ödeme entegrasyonu, admin paneli, çoklu deneme türleri, zamanlı sınavlar ve PDF yönetimi gibi özellikler içermektedir. Modern web teknolojileri kullanılarak geliştirilmiş, ölçeklenebilir bir yapıya sahiptir.

