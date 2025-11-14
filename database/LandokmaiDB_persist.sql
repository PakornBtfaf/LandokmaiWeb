CREATE DATABASE IF NOT EXISTS LandokmaiDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE LandokmaiDB;

-- 1) users
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2) flowers
CREATE TABLE IF NOT EXISTS flowers (
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

-- 3) blog_posts (ตรงกับที่เซิร์ฟเวอร์ใช้)
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug  VARCHAR(220) NOT NULL UNIQUE,
  content MEDIUMTEXT NOT NULL,
  cover_url VARCHAR(500),
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_slug (slug),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) orders
CREATE TABLE IF NOT EXISTS orders (
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

-- 5) order_items
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  flower_id  INT NULL,
  name_snap  VARCHAR(200) NOT NULL,
  price_snap DECIMAL(10,2) NOT NULL,
  qty        INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id)  REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (flower_id) REFERENCES flowers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

UPDATE blog_posts
SET slug = REPLACE(LOWER(TRIM(title)),' ','-')
WHERE (slug IS NULL OR slug='');

SELECT * FROM orders ORDER BY id DESC;
SELECT * FROM order_items ORDER BY id DESC;