// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3030;

// ===== Global Request Logger =====
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ===== Static files (โฟลเดอร์ html) =====
app.use(express.static(path.join(__dirname, 'html')));

// ===== Body parsers =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ---------- MySQL Pool ---------- */
const DB_NAME = (process.env.DB_NAME || 'Landokmai').trim(); // บังคับใช้ชื่อเดียวกัน
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_general_ci'
});
console.log('✅ Using DB:', DB_NAME);

/* ---------- Helper: ทำความสะอาดข้อความค้นหา ---------- */
function normalizeQuery(q = '') {
  return q.toString().trim().toLowerCase();
}

/* ---------- Routes เดิม ---------- */
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'Homepage.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'Login.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  console.log(`Form submitted. email=${email || '(blank)'}, password=${password ? '(provided)' : '(blank)'}`);
  res.sendFile(path.join(__dirname, 'html', 'success.html'));
});

app.get('/success', (_req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'success.html'));
});

/* ---------- NEW: Search Flower ---------- */
app.get('/search', async (req, res) => {
  try {
    const keywordRaw = req.query.q || '';
    const keyword = normalizeQuery(keywordRaw);
    if (!keyword) {
      console.log('❌ Empty search query');
      return res.sendFile(path.join(__dirname, 'html', 'Shop.html'));
    }

    const sql = `
      SELECT page_file
      FROM flowers
      WHERE LOWER(name_th) = ? OR LOWER(name_en) = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [keyword, keyword]);

    if (rows.length > 0) {
      const pageFile = rows[0].page_file;
      const safePath = path.normalize(pageFile).replace(/^(\.\.[/\\])+/, '');
      const fullPath = path.join(__dirname, 'html', safePath);
      console.log(`✅ Found flower "${keyword}" → ${pageFile}`);
      return res.sendFile(fullPath);
    } else {
      console.log(`❌ Flower not found: ${keyword}`);
      return res.sendFile(path.join(__dirname, 'html', 'Shop.html'));
    }
  } catch (err) {
    console.error('❌ Search error:', err);
    return res.sendFile(path.join(__dirname, 'html', 'Shop.html'));
  }
});

/* ---------- 404 ---------- */
app.use((req, res) => {
  console.log('404: Invalid access at', req.url);
  res.status(404).sendFile(path.join(__dirname, 'html', 'not_Found.html'));
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
