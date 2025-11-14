
DROP DATABASE IF EXISTS LandokmaiDB;
CREATE DATABASE LandokmaiDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE LandokmaiDB;

-- TABLES

-- 1) users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2) (optional) login logs
DROP TABLE IF EXISTS login_logs;
CREATE TABLE login_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  ip_addr    VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3) flowers (เพิ่ม name_en + index ให้ค้นหาได้เร็ว)
DROP TABLE IF EXISTS flowers;
CREATE TABLE flowers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name_th     VARCHAR(150) NOT NULL,
  name_en     VARCHAR(150),
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url   VARCHAR(500),
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name_th (name_th),
  INDEX idx_name_en (name_en)
) ENGINE=InnoDB;

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS slug VARCHAR(220) NOT NULL UNIQUE AFTER title,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;

CREATE INDEX IF NOT EXISTS idx_slug ON blog_posts(slug);

UPDATE blog_posts SET slug = REPLACE(LOWER(TRIM(title)),' ','-')
WHERE (slug IS NULL OR slug='');

-- 5) orders
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NULL,
  order_no         VARCHAR(32) NOT NULL UNIQUE,
  customer_name    VARCHAR(120) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_phone   VARCHAR(32) NOT NULL,
  total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6) order_items
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  flower_id  INT NULL,
  name_snap  VARCHAR(200) NOT NULL,
  price_snap DECIMAL(10,2) NOT NULL,
  qty        INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (flower_id) REFERENCES flowers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_profiles (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  full_name  VARCHAR(120) NOT NULL,
  address    TEXT NOT NULL,
  phone      VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO flowers (name_th, name_en, price, image_url, description) VALUES
('Happy Blue ', 'Happy Blue', 1490.00, 'https://static.wixstatic.com/media/83dc23_29551fe239024c1dafefbe15cd1f0f52~mv2.jpeg', 'ช่อดอกไม้โทนฟ้าสดใส'),
('Flower Box', 'Flower Box', 1790.00, 'https://static.wixstatic.com/media/78aa83_1bd3e8c0c52949d39c4790ebd7becd73~mv2.jpg', 'โทนฟ้าขาวสดใส'),
('Flesh Rose', 'Flesh Rose', 2790.00, 'https://static.wixstatic.com/media/78aa83_a7b241c561e54a079ebc2659bd1d70c3~mv2.jpeg', 'ธีมวาเลนไทน์ กุหลาบสดใส'),
('Witch’s Roses', 'Witch’s Roses', 3590.00, 'https://static.wixstatic.com/media/78aa83_fe8a7f87b8c748599309d20b0e6c0367~mv2.jpeg', 'กุหลาบขาวบริสุทธิ์');

ALTER TABLE flowers
  MODIFY image_url MEDIUMTEXT NULL;
  
SELECT * FROM orders ORDER BY id DESC;
SELECT * FROM order_items ORDER BY id DESC;