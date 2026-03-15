const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// ===== ENV =====
const PORT = process.env.PORT || 3030;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'LandokmaiDB';
const SESSION_SECRET = process.env.SESSION_SECRET || 'landokmai-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@landokmai.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_FULLNAME = process.env.ADMIN_FULLNAME || 'Administrator';

// ===== DB POOL =====
let pool;
async function initDB() {
  pool = mysql.createPool({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
    waitForConnections: true, connectionLimit: 10, namedPlaceholders: true,
  });

  // users
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`);

  // flowers
  await pool.query(`CREATE TABLE IF NOT EXISTS flowers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_th VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url MEDIUMTEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name_th (name_th),
    INDEX idx_name_en (name_en)
  ) ENGINE=InnoDB;`);

  // orders
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    order_no VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(120) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;`);

  // order_items
  await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    flower_id INT NULL,
    name_snap VARCHAR(200) NOT NULL,
    price_snap DECIMAL(10,2) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (flower_id) REFERENCES flowers(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;`);

  // blog_posts
  await pool.query(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    content MEDIUMTEXT NOT NULL,
    cover_url VARCHAR(500),
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_slug (slug)
  ) ENGINE=InnoDB;`);

  // seed admin
  const [rows] = await pool.query('SELECT id FROM users WHERE email=? LIMIT 1', [ADMIN_EMAIL]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
      [ADMIN_FULLNAME, ADMIN_EMAIL, hash]
    );
    console.log(`Seeded admin -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }
}

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(session({
  secret: SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));
app.use(express.static(path.join(__dirname, 'html')));

// ===== HELPERS =====
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).sendFile(path.join(__dirname, 'html', 'Login.html'));
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).send('Forbidden: admin only');
  next();
}
const genOrderNo = () => {
  const d = new Date();
  return 'OD' + d.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
};

// ✅ แก้แล้ว: slugify รองรับภาษาไทย + fallback กันว่าง
function slugify(s = '') {
  const str = s.toString().trim();
  const slug = str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0E00-\u0E7Fa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return slug || `post-${Date.now()}`;
}

// ===== PAGES =====
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'html', 'Homepage.html')));
app.get('/shop', (_req, res) => res.sendFile(path.join(__dirname, 'html', 'Shop.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, 'html', 'Login.html')));
app.get('/checkout', requireLogin, (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return res.redirect('/admin');
  }
  return res.sendFile(path.join(__dirname, 'html', 'checkout.html'));
});
app.get('/admin', requireAdmin, (_req, res) => res.sendFile(path.join(__dirname, 'html', 'admin.html')));
app.get('/success', (_req, res) => res.sendFile(path.join(__dirname, 'html', 'success.html')));
app.get('/blogs', (_req, res) => res.sendFile(path.join(__dirname, 'html', 'Blog.html')));

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body || {};
    if (!full_name || !email || !password) return res.status(400).json({ message: 'full_name, email, password required' });

    const [dup] = await pool.query('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
    if (dup.length) return res.status(409).json({ message: 'email_exists' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, "user")',
      [full_name, email, hash]);
    req.session.user = { id: r.insertId, name: full_name, email, role: 'user' };
    res.json({ message: 'ok', user: req.session.user });
  } catch (e) { console.error('register error', e); res.status(500).json({ message: 'server_error' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email & password required' });
    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email=? LIMIT 1', [email]
    );
    if (!rows.length) return res.status(401).json({ message: 'invalid_credentials' });
    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ message: 'invalid_credentials' });
    req.session.user = { id: u.id, name: u.full_name, email: u.email, role: u.role };
    res.json({ message: 'ok', user: req.session.user });
  } catch (e) { console.error('login error', e); res.status(500).json({ message: 'server_error' }); }
});

app.post('/api/auth/logout', (req, res) => req.session.destroy(() => res.json({ message: 'ok' })));

// ===== SESSION CHECK =====
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'not_logged_in' });
  res.json({ user: req.session.user });
});

// ===== FLOWERS (SEARCH + DETAIL) =====
app.get('/api/flowers', async (req, res) => {
  try {
    const q = (req.query.search || '').trim();
    if (!q) {
      const [rows] = await pool.query(
        'SELECT id, name_th, name_en, price, image_url, description FROM flowers ORDER BY id DESC LIMIT 50'
      );
      return res.json(rows);
    }
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, name_th, name_en, price, image_url, description
       FROM flowers
       WHERE name_th LIKE ? OR name_en LIKE ? OR description LIKE ?
       ORDER BY id DESC LIMIT 50`,
      [like, like, like]
    );
    res.json(rows);
  } catch (e) { console.error('flowers error', e); res.status(500).json({ message: 'server_error' }); }
});

app.get('/api/flowers/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name_th, name_en, price, image_url, description FROM flowers WHERE id=? LIMIT 1',
      [Number(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ message: 'not_found' });
    res.json(rows[0]);
  } catch (e) { console.error('flower by id error', e); res.status(500).json({ message: 'server_error' }); }
});

// ===== ADMIN: Manage flowers =====
app.post('/api/admin/flowers', requireAdmin, async (req, res) => {
  try {
    const { name_th, name_en, price, image_url, description } = req.body || {};
    if (!name_th || price == null) return res.status(400).json({ message: 'name_th & price required' });
    const [r] = await pool.query(
      'INSERT INTO flowers (name_th, name_en, price, image_url, description) VALUES (?, ?, ?, ?, ?)',
      [name_th, name_en || null, price, image_url || null, description || null]
    );
    res.json({ id: r.insertId, message: 'created' });
  } catch (e) { console.error('admin create flower error', e); res.status(500).json({ message: 'server_error' }); }
});

app.put('/api/admin/flowers/:id', requireAdmin, async (req, res) => {
  try {
    const { name_th, name_en, price, image_url, description } = req.body || {};
    if (!name_th || price == null) return res.status(400).json({ message: 'name_th & price required' });
    await pool.query(
      'UPDATE flowers SET name_th=?, name_en=?, price=?, image_url=?, description=? WHERE id=?',
      [name_th, name_en || null, price, image_url || null, description || null, Number(req.params.id)]
    );
    res.json({ message: 'updated' });
  } catch (e) { console.error('admin update flower error', e); res.status(500).json({ message: 'server_error' }); }
});

app.delete('/api/admin/flowers/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM flowers WHERE id=?', [Number(req.params.id)]);
    res.json({ message: 'deleted' });
  } catch (e) { console.error('admin delete flower error', e); res.status(500).json({ message: 'server_error' }); }
});

// ===== ORDERS =====
// ✅ แก้แล้ว: ย้าย release ออกจาก early return + บันทึกลง DB ครบถ้วน
app.post('/api/orders', requireLogin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { customer_name, customer_address, customer_phone, items } = req.body || {};
    if (!customer_name || !customer_address || !customer_phone || !Array.isArray(items) || !items.length) {
      conn.release();
      return res.status(400).json({ message: 'invalid_order' });
    }

    const ids = items.map(i => Number(i.flower_id)).filter(Boolean);
    const [rows] = ids.length
      ? await conn.query(`SELECT id, name_th, price FROM flowers WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
      : [[]];
    const map = new Map(rows.map(r => [r.id, r]));

    let total = 0;
    const normalized = items.map(it => {
      const f = map.get(Number(it.flower_id));
      const qty = Math.max(1, Number(it.qty || 1));
      if (!f) return null;
      total += Number(f.price) * qty;
      return { flower_id: f.id, name_snap: f.name_th, price_snap: f.price, qty };
    }).filter(Boolean);

    if (!normalized.length) {
      conn.release();
      return res.status(400).json({ message: 'no_valid_items' });
    }

    await conn.beginTransaction();
    const orderNo = genOrderNo();

    const [r1] = await conn.query(
      `INSERT INTO orders (user_id, order_no, customer_name, customer_address, customer_phone, total_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.session.user.id, orderNo, customer_name, customer_address, customer_phone, total]
    );
    const orderId = r1.insertId;

    for (const it of normalized) {
      await conn.query(
        'INSERT INTO order_items (order_id, flower_id, name_snap, price_snap, qty) VALUES (?, ?, ?, ?, ?)',
        [orderId, it.flower_id, it.name_snap, it.price_snap, it.qty]
      );
    }

    await conn.commit();
    res.json({ message: 'ok', order_no: orderNo, order_id: orderId, total });
  } catch (e) {
    await conn.rollback();
    console.error('create order error', e);
    res.status(500).json({ message: 'server_error' });
  } finally {
    conn.release();
  }
});

// ✅ ใหม่: user ดูประวัติสั่งซื้อของตัวเอง
app.get('/api/orders/mine', requireLogin, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT id, order_no, customer_name, customer_address, customer_phone, total_amount, created_at
       FROM orders WHERE user_id = ? ORDER BY id DESC`,
      [req.session.user.id]
    );
    if (!orders.length) return res.json([]);

    const orderIds = orders.map(o => o.id);
    const [orderItems] = await pool.query(
      `SELECT order_id, name_snap, price_snap, qty
       FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    );

    const itemMap = {};
    orderItems.forEach(it => {
      if (!itemMap[it.order_id]) itemMap[it.order_id] = [];
      itemMap[it.order_id].push(it);
    });

    res.json(orders.map(o => ({ ...o, items: itemMap[o.id] || [] })));
  } catch (e) {
    console.error('get my orders error', e);
    res.status(500).json({ message: 'server_error' });
  }
});

// ✅ ใหม่: admin ดูออเดอร์ทั้งหมดพร้อม items
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_no, o.customer_name, o.customer_phone, o.customer_address,
              o.total_amount, o.created_at, u.email AS user_email
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC LIMIT 100`
    );
    if (!orders.length) return res.json([]);

    const orderIds = orders.map(o => o.id);
    const [orderItems] = await pool.query(
      `SELECT order_id, name_snap, price_snap, qty
       FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    );

    const itemMap = {};
    orderItems.forEach(it => {
      if (!itemMap[it.order_id]) itemMap[it.order_id] = [];
      itemMap[it.order_id].push(it);
    });

    res.json(orders.map(o => ({ ...o, items: itemMap[o.id] || [] })));
  } catch (e) {
    console.error('admin get orders error', e);
    res.status(500).json({ message: 'server_error' });
  }
});

// ===== BLOG: Public =====
app.get('/api/blogs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.title, b.slug, b.cover_url, b.created_at,
              u.full_name AS author
       FROM blog_posts b
       JOIN users u ON u.id = b.author_id
       ORDER BY b.id DESC LIMIT 50`
    );
    res.json(rows);
  } catch (e) { console.error('blogs list error', e); res.status(500).json({ message: 'server_error' }); }
});

app.get('/api/blogs/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.title, b.slug, b.cover_url, b.content, b.created_at, b.updated_at,
              u.full_name AS author
       FROM blog_posts b
       JOIN users u ON u.id = b.author_id
       WHERE b.slug = ? LIMIT 1`, [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'not_found' });
    res.json(rows[0]);
  } catch (e) { console.error('blog detail error', e); res.status(500).json({ message: 'server_error' }); }
});

// ===== BLOG: Admin =====
app.post('/api/admin/blogs', requireAdmin, async (req, res) => {
  try {
    const { title, content, cover_url } = req.body || {};
    if (!title || !content) return res.status(400).json({ message: 'title & content required' });

    // ✅ แก้แล้ว: slugify รองรับภาษาไทย + fallback กันว่าง
    let slug = slugify(title);
    if (!slug) slug = `post-${Date.now()}`;

    let s = slug, i = 1;
    while (true) {
      const [dup] = await pool.query('SELECT id FROM blog_posts WHERE slug=? LIMIT 1', [s]);
      if (!dup.length) { slug = s; break; }
      s = `${slug}-${++i}`;
    }
    const [r] = await pool.query(
      'INSERT INTO blog_posts (title, slug, content, cover_url, author_id) VALUES (?, ?, ?, ?, ?)',
      [title, slug, content, cover_url || null, req.session.user.id]
    );
    res.json({ id: r.insertId, slug, message: 'created' });
  } catch (e) { console.error('admin create blog error', e); res.status(500).json({ message: 'server_error' }); }
});

app.put('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
  try {
    const { title, content, cover_url } = req.body || {};
    if (!title || !content) return res.status(400).json({ message: 'title & content required' });
    await pool.query(
      'UPDATE blog_posts SET title=?, content=?, cover_url=?, updated_at=NOW() WHERE id=?',
      [title, content, cover_url || null, Number(req.params.id)]
    );
    res.json({ message: 'updated' });
  } catch (e) { console.error('admin update blog error', e); res.status(500).json({ message: 'server_error' }); }
});

app.delete('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM blog_posts WHERE id=?', [Number(req.params.id)]);
    res.json({ message: 'deleted' });
  } catch (e) { console.error('admin delete blog error', e); res.status(500).json({ message: 'server_error' }); }
});

// ===== 404 =====
app.use((req, res) => {
  const errorPath = path.join(__dirname, 'html', 'error.html');
  if (fs.existsSync(errorPath)) return res.status(404).sendFile(errorPath);
  res.status(404).send('404 Not Found');
});

// ===== START =====
initDB()
  .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
  .catch(e => { console.error('DB init failed', e); process.exit(1); });
