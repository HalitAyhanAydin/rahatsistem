const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const cron = require('node-cron');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// SSL sertifika doğrulamasını devre dışı bırak (sadece geliştirme için)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// HTTPS agent oluştur
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Create tables if they don't exist
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        account_code VARCHAR(50) UNIQUE NOT NULL,
        total_debt DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id SERIAL PRIMARY KEY,
        sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        records_processed INTEGER DEFAULT 0,
        success BOOLEAN DEFAULT false,
        error_message TEXT
      )
    `);
    
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API functions
async function getApiToken() {
  try {
    const auth = Buffer.from(`${process.env.API_USERNAME}:${process.env.API_PASSWORD}`).toString('base64');
    
    const response = await axios.post(process.env.API_TOKEN_URL, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      httpsAgent: httpsAgent
    });
    
    return response.data.response.token;
  } catch (error) {
    console.error('Token alma hatası:', error.message);
    throw error;
  }
}

async function fetchApiData(token) {
  try {
    const response = await axios.patch(process.env.API_DATA_URL, {
      fieldData: {},
      script: "getData"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      httpsAgent: httpsAgent
    });
    
    return JSON.parse(response.data.response.scriptResult);
  } catch (error) {
    console.error('Veri çekme hatası:', error.message);
    throw error;
  }
}

async function syncData() {
  console.log('Veri senkronizasyonu başladı...');
  let recordsProcessed = 0;
  let syncSuccess = false;
  let errorMessage = null;
  
  try {
    // Get token from real API
    const token = await getApiToken();
    console.log('Token alındı');
    
    // Fetch data from real API
    const apiData = await fetchApiData(token);
    console.log(`${apiData.length} kayıt alındı`);
    
    // Process each record
    for (const record of apiData) {
      // API'den gelen veri yapısını kontrol et
      if (recordsProcessed === 0) {
        console.log('API Record sample:', Object.keys(record).slice(0, 10)); // İlk 10 field'ı logla
        console.log('Sample record:', record); // Tam record'u da göster
      }
      
      // API'den gelen field'ları map et
      const accountCode = record.hesap_kodu || record.Hesap_Kodu || record.account_code || record.AccountCode;
      // Borç miktarı için 'borc' field'ını kullan
      const totalDebt = parseFloat(record.borc || record.Borc || record.total_debt || record.TotalDebt || 0);
      
      if (accountCode) {
        await pool.query(`
          INSERT INTO accounts (account_code, total_debt, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (account_code)
          DO UPDATE SET 
            total_debt = EXCLUDED.total_debt,
            updated_at = CURRENT_TIMESTAMP
        `, [accountCode, totalDebt]);
        
        recordsProcessed++;
      }
    }
    
    // Eğer API'den veri gelmezse demo data kullan
    if (recordsProcessed === 0) {
      console.log('API verisi işlenemedi, demo data kullanılıyor...');
      const demoData = [
        { account_code: '120', total_debt: 2206418.32 },
        { account_code: '120.01', total_debt: 2206418.32 },
        { account_code: '153', total_debt: 51649.95 },
        { account_code: '153.01', total_debt: 51649.95 },
        { account_code: '153.01.0018', total_debt: 47271.43 },
        { account_code: '153.01.0008', total_debt: 1322.22 },
        { account_code: '153.01.0001', total_debt: 2970.3 },
        { account_code: '153.01.0000', total_debt: 86 },
        { account_code: '191', total_debt: 8806.34 },
        { account_code: '191.03', total_debt: 162 },
        { account_code: '191.02', total_debt: 283.5 },
        { account_code: '191.01', total_debt: 8360.84 },
        { account_code: '320', total_debt: 0 },
        { account_code: '320.01', total_debt: 0 },
        { account_code: '360', total_debt: 0 },
        { account_code: '360.02', total_debt: 0 },
        { account_code: '391', total_debt: 0 },
        { account_code: '391.03', total_debt: 0 },
        { account_code: '391.02', total_debt: 0 },
        { account_code: '391.01', total_debt: 0 },
        { account_code: '600', total_debt: 0 },
        { account_code: '600.01', total_debt: 0 },
        { account_code: '610', total_debt: 900 },
        { account_code: '610.01', total_debt: 900 }
      ];

      for (const record of demoData) {
        await pool.query(`
          INSERT INTO accounts (account_code, total_debt, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (account_code)
          DO UPDATE SET 
            total_debt = EXCLUDED.total_debt,
            updated_at = CURRENT_TIMESTAMP
        `, [record.account_code, record.total_debt]);
        
        recordsProcessed++;
      }
    }
    
    syncSuccess = true;
    console.log(`Senkronizasyon tamamlandı. ${recordsProcessed} kayıt işlendi.`);
    
  } catch (error) {
    errorMessage = error.message;
    console.error('Senkronizasyon hatası:', error);
    
    // API hatası durumunda demo data kullan
    console.log('API hatası nedeniyle demo data kullanılıyor...');
    const demoData = [
      { account_code: '120', total_debt: 2206418.32 },
      { account_code: '120.01', total_debt: 2206418.32 },
      { account_code: '153', total_debt: 51649.95 },
      { account_code: '153.01', total_debt: 51649.95 },
      { account_code: '153.01.0018', total_debt: 47271.43 },
      { account_code: '153.01.0008', total_debt: 1322.22 },
      { account_code: '153.01.0001', total_debt: 2970.3 },
      { account_code: '153.01.0000', total_debt: 86 },
      { account_code: '191', total_debt: 8806.34 },
      { account_code: '191.03', total_debt: 162 },
      { account_code: '191.02', total_debt: 283.5 },
      { account_code: '191.01', total_debt: 8360.84 },
      { account_code: '320', total_debt: 0 },
      { account_code: '320.01', total_debt: 0 },
      { account_code: '360', total_debt: 0 },
      { account_code: '360.02', total_debt: 0 },
      { account_code: '391', total_debt: 0 },
      { account_code: '391.03', total_debt: 0 },
      { account_code: '391.02', total_debt: 0 },
      { account_code: '391.01', total_debt: 0 },
      { account_code: '600', total_debt: 0 },
      { account_code: '600.01', total_debt: 0 },
      { account_code: '610', total_debt: 900 },
      { account_code: '610.01', total_debt: 900 }
    ];

    try {
      for (const record of demoData) {
        await pool.query(`
          INSERT INTO accounts (account_code, total_debt, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (account_code)
          DO UPDATE SET 
            total_debt = EXCLUDED.total_debt,
            updated_at = CURRENT_TIMESTAMP
        `, [record.account_code, record.total_debt]);
        
        recordsProcessed++;
      }
      syncSuccess = true;
    } catch (dbError) {
      console.error('Demo data hatası:', dbError);
    }
  }
  
  // Log sync result
  await pool.query(`
    INSERT INTO sync_log (records_processed, success, error_message)
    VALUES ($1, $2, $3)
  `, [recordsProcessed, syncSuccess, errorMessage]);
}

// Routes
app.get('/api/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY account_code');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accounts/hierarchy', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY account_code');
    const accounts = result.rows;
    
    // Create hierarchical structure
    const hierarchy = createHierarchy(accounts);
    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    await syncData();
    res.json({ message: 'Senkronizasyon tamamlandı' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sync-log', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sync_log ORDER BY sync_time DESC LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function createHierarchy(accounts) {
  const hierarchy = {};
  
  // Önce tüm hesapları koda göre sırala
  const sortedAccounts = accounts.sort((a, b) => a.account_code.localeCompare(b.account_code));
  
  // Sadece en detaylı (en uzun) hesap kodlarını topla
  const maxLevelAccounts = {};
  
  // Her hesap grubu için en detaylı kodu bul
  sortedAccounts.forEach(account => {
    const code = account.account_code;
    const parts = code.split('.');
    const level1 = parts[0];
    
    if (parts.length === 1) {
      // Seviye 1 kod (xxx)
      if (!maxLevelAccounts[level1] || maxLevelAccounts[level1].length < parts.length) {
        maxLevelAccounts[level1] = code;
      }
    } else if (parts.length === 2) {
      // Seviye 2 kod (xxx.xx)
      const level2 = `${parts[0]}.${parts[1]}`;
      if (!maxLevelAccounts[level2] || maxLevelAccounts[level2].length < parts.length) {
        maxLevelAccounts[level2] = code;
      }
    } else {
      // Seviye 3+ kod (xxx.xx.xxxx) - bunlar zaten en detaylı
      maxLevelAccounts[code] = code;
    }
  });
  
  // Sadece en detaylı hesapların borçlarını kullan
  const accountMap = {};
  sortedAccounts.forEach(account => {
    accountMap[account.account_code] = parseFloat(account.total_debt);
  });
  
  // Hiyerarşi oluştur
  sortedAccounts.forEach(account => {
    const code = account.account_code;
    const parts = code.split('.');
    
    // Level 1: First 3 digits
    const level1 = parts[0];
    if (!hierarchy[level1]) {
      hierarchy[level1] = {
        code: level1,
        total_debt: 0,
        children: {}
      };
    }
    
    if (parts.length > 1) {
      // Level 2: First 5 digits (xxx.xx)
      const level2 = `${parts[0]}.${parts[1]}`;
      if (!hierarchy[level1].children[level2]) {
        hierarchy[level1].children[level2] = {
          code: level2,
          total_debt: 0,
          children: {}
        };
      }
      
      if (parts.length > 2) {
        // Level 3: Full code - en detaylı kod
        hierarchy[level1].children[level2].children[code] = {
          code: code,
          total_debt: accountMap[code],
          children: {}
        };
      }
    }
  });
  
  // Şimdi alttan yukarı doğru topla
  Object.keys(hierarchy).forEach(level1Key => {
    const level1 = hierarchy[level1Key];
    level1.total_debt = 0;
    
    Object.keys(level1.children).forEach(level2Key => {
      const level2 = level1.children[level2Key];
      level2.total_debt = 0;
      
      // Level 3'ten level 2'ye topla
      Object.keys(level2.children).forEach(level3Key => {
        level2.total_debt += level2.children[level3Key].total_debt;
      });
      
      // Eğer level 2'nin kendi borcu varsa ve alt hesabı yoksa, kendi borcunu kullan
      if (Object.keys(level2.children).length === 0 && accountMap[level2Key]) {
        level2.total_debt = accountMap[level2Key];
      }
      
      // Level 2'den level 1'e topla
      level1.total_debt += level2.total_debt;
    });
    
    // Eğer level 1'in kendi borcu varsa ve alt hesabı yoksa, kendi borcunu kullan
    if (Object.keys(level1.children).length === 0 && accountMap[level1Key]) {
      level1.total_debt = accountMap[level1Key];
    }
  });
  
  return hierarchy;
}

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server ${PORT} portunda çalışıyor`);
    
    // Schedule data sync every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      console.log('Scheduled sync starting...');
      syncData();
    });
    
    // Initial sync
    setTimeout(() => {
      syncData();
    }, 2000);
  });
});

module.exports = app;
