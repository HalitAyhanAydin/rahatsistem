# Test API Veri Dökümantasyonu

Bu proje, harici API'den veri çekerek PostgreSQL veritabanına senkronize eden ve hiyerarşik yapıda web sayfasında gösteren full-stack bir uygulamadır.

## 🌐 Canlı Demo

- **GitHub Repository**: [https://github.com/HalitAyhanAydin/rahatsistem](https://github.com/HalitAyhanAydin/rahatsistem)
- **Frontend (Vercel)**: [Yakında eklenecek]
- **Backend API**: [Yakında eklenecek]

## � Teknolojiler

- **Backend**: Node.js + Express.js (Port 3001)
- **Database**: PostgreSQL  
- **Frontend**: Next.js + React + TypeScript (Port 3000)
- **Styling**: Tailwind CSS
- **API Integration**: FileMaker API
- **Deployment**: Vercel (Frontend) + Railway/Heroku (Backend)

## � Proje Yapısı

```
/
├── server/
│   └── index.js           # Express.js backend
├── src/
│   ├── app/
│   │   ├── page.tsx       # Ana sayfa
│   │   ├── layout.tsx     # Layout wrapper
│   │   └── globals.css    # Global stiller
│   └── components/
│       ├── HierarchyView.tsx    # Hiyerarşik görünüm
│       └── SyncControls.tsx     # Senkronizasyon kontrolleri
├── .env.local             # Çevre değişkenleri
├── package.json           # NPM bağımlılıkları
└── README.md              # Bu dosya
```

## 🔧 Kurulum

### 1. Repository'yi klonlayın
```bash
git clone https://github.com/HalitAyhanAydin/rahatsistem.git
cd rahatsistem
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Çevre değişkenlerini ayarlayın
`.env.local` dosyası oluşturun:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=testapi_db
DB_USER=testapi_user
DB_PASSWORD=testapi_password

# API Configuration
API_USERNAME=apitest
API_PASSWORD=test123
API_TOKEN_URL=https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/sessions
API_DATA_URL=https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/layouts/testdb/records/1

# Server Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

### 4. PostgreSQL veritabanını ayarlayın
```bash
# PostgreSQL kurulumu (macOS)
brew install postgresql
brew services start postgresql

# Veritabanı ve kullanıcı oluşturma
createdb testapi_db
createuser testapi_user
```

## 🚀 Çalıştırma

### Geliştirme Ortamı
```bash
# Frontend (port 3000)
npm run dev

# Backend (port 3001) 
npm run server

# Her ikisini birden
npm run dev & npm run server
```

### Production Build
```bash
npm run build
npm start
```

5. **Environment variables'ları yapılandırın**
   `.env.local` dosyasını oluşturun:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=testapi_db
   DB_USER=testapi_user
   DB_PASSWORD=testapi_password
   
   API_USERNAME=apitest
   API_PASSWORD=test123
   API_TOKEN_URL=https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/sessions
   API_DATA_URL=https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/layouts/testdb/records/1
   
   FRONTEND_PORT=3000
   BACKEND_PORT=3001
   ```

## 🏃‍♂️ Çalıştırma

1. **Backend server'ı başlatın**
   ```bash
   npm run server:dev
   ```

2. **Frontend'i başlatın** (ayrı terminalde)
   ```bash
   npm run dev
   ```

3. **Uygulamayı açın**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📊 Veri Yapısı

### Hesap Kodları Hierarchical Yapısı

- **1. Seviye**: İlk 3 rakam (örn: 120, 153, 191)
- **2. Seviye**: İlk 5 rakam (örn: 120.01, 153.01, 191.03)
- **3. Seviye**: Tam kod (örn: 153.01.0018, 153.01.0008)

### Veritabanı Tabloları

```sql
-- Hesap kodları tablosu
accounts (
  id SERIAL PRIMARY KEY,
  account_code VARCHAR(50) UNIQUE NOT NULL,
  total_debt DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Senkronizasyon log tablosu
sync_log (
  id SERIAL PRIMARY KEY,
  sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  records_processed INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  error_message TEXT
)
```

## 🔄 API Endpoints

### Backend API

- `GET /api/accounts` - Tüm hesap kodlarını getir
- `GET /api/accounts/hierarchy` - Hierarchical yapıyı getir
- `POST /api/sync` - Manuel senkronizasyon başlat
- `GET /api/sync-log` - Senkronizasyon geçmişini getir

### External API Integration

1. **Token Alma**
   ```
   POST https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/sessions
   Authorization: Basic Auth (apitest:test123)
   ```

2. **Veri Çekme**
   ```
   PATCH https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/layouts/testdb/records/1
   Authorization: Bearer {token}
   Body: {"fieldData": {}, "script": "getData"}
   ```

## 💻 Kullanım

1. Uygulama açıldığında mevcut veriler hierarchical görünümde listelenir
2. "Senkronize Et" butonu ile manuel veri güncelleme yapılabilir
3. Veriler otomatik olarak her 5 dakikada senkronize edilir
4. Expandable tree yapısında 3 seviyeli görüntüleme
5. Para birimi formatında borç miktarları gösterimi

## 🎨 UI Özellikleri

- **Responsive Design**: Mobil ve desktop uyumlu
- **Interactive Tree**: Expandable/collapsible hierarchical görünüm
- **Color Coding**: Seviye bazında renk kodlaması
- **Real-time Status**: Son senkronizasyon zamanı ve durumu
- **Loading States**: Yükleme durumu göstergeleri

## 🔧 Geliştirme Scripts

```bash
npm run dev          # Frontend development server
npm run server:dev   # Backend development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint kontrolü
```

## 📝 Notlar

- SSL sertifika sorunu için development ortamında certificate validation devre dışı bırakılmıştır
- Demo data örnekte verilen değerlerle test edilebilir
- API bağlantısı başarısız olursa demo data kullanılır
- Veritabanı bağlantısı otomatik olarak kurulur ve tablolar oluşturulur

## 🐛 Sorun Giderme

1. **PostgreSQL bağlantı hatası**: PostgreSQL servisinin çalıştığından emin olun
2. **Port çakışması**: .env.local dosyasında port numaralarını değiştirin
3. **SSL sertifika hatası**: NODE_TLS_REJECT_UNAUTHORIZED=0 zaten ayarlanmış
4. **API erişim sorunu**: Demo data ile test yapabilirsiniz

## 📞 İletişim

Proje tamamlandığında WhatsApp: 0542 315 88 12
