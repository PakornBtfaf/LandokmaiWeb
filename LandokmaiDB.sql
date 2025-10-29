-- สร้าง DB ชื่อ Landokmai ถ้ายังไม่มี
CREATE DATABASE IF NOT EXISTS `Landokmai`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `Landokmai`;

-- ตารางเก็บรายการดอกไม้
CREATE TABLE IF NOT EXISTS `flowers` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_th  VARCHAR(100) NOT NULL,
  name_en  VARCHAR(100),
  page_file VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ข้อมูลตัวอย่าง (ใช้ INSERT ... ON DUPLICATE KEY จะไม่ได้ เพราะยังไม่มี unique)
-- เลยใช้วิธีลบของเดิมชื่อเดียวกันก่อน แล้วค่อยใส่ใหม่
DELETE FROM flowers WHERE name_th IN ('กุหลาบ','ลิลลี่','หน้าวัว')
                     OR name_en IN ('rose','lily','anthurium');

INSERT INTO flowers (name_th, name_en, page_file) VALUES
('กุหลาบ', 'rose', 'rose.html'),
('ลิลลี่', 'lily', 'lily.html'),
('ทิวลิป', 'tulip', 'tulip.html');
