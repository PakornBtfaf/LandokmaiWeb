# LandokmaiWeb
LANDOKMAI WEB — Full-Stack Flower Shop Application

# LandokmaiWeb 🌸  
Full-Stack Flower Shop Web Application

LandokmaiWeb is a full-stack web application for an online flower shop.  
The project is designed as a learning and portfolio project to demonstrate skills in **web development**, **backend APIs**, and **database design**.

---

## 1. Overview

LandokmaiWeb simulates a real flower shop that also sells products online.  
Customers can browse bouquets, add them to a cart, and place orders.  
Admins can manage products, blog posts, and view customer orders through the backend system.

This project is built with:

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js, Express  
- **Database:** MySQL  
- **Architecture:** Separation between `frontend (html/)`, `backend/`, and `database/`.

---

## 2. Main Features

### 2.1 Customer Side (User)

- **Home Page**
  - Introduces the Landokmai flower shop concept.
  - Navigation bar to access *Home*, *Shop*, *Blog*, *Login*, etc.

- **Shop Page**
  - Displays list of flower products (name, image, price, short description).
  - Products are loaded from **MySQL** through a Node.js/Express API.
  - Product cards use a clean, responsive layout.

- **Search & Filtering**
  - Users can search flowers by name.
  - Search requests are sent to the backend and matched against the `flowers` table in MySQL.

- **Shopping Cart**
  - Users can add products to a cart.
  - Shows list of selected items, quantity, and total price.
  - Cart state is managed on the frontend and connected to the checkout flow.

- **Checkout / Order Form**
  - Users fill in order details:
    - Full name  
    - Delivery address  
    - Phone number  
    - Additional notes (optional)
  - When an order is submitted:
    - Order data (user info + cart items) is sent to the backend.
    - Order is stored in **MySQL** in the `orders` and/or related order detail tables.
  - A **Thank You / Order Confirmation** message is shown after successful submission.

- **Blog (Customer View)**
  - Customers can read blog posts written by the admin.
  - Blog can be used for flower care tips, special promotions, or shop stories.

---

### 2.2 Admin Side

- **Authentication**
  - Login page with email & password.
  - System distinguishes between **admin** and **normal user**.
  - Only admins can access management functions.

- **Admin Dashboard**
  - Overview of management functions for:
    - Products (flowers)
    - Blog posts
    - Orders

- **Product Management**
  - **Create** new flower products (name, price, description, image URL).
  - **Read** / list all products.
  - **Update** existing product info.
  - **Delete** products from the catalog.
  - Data is persisted in the `flowers` table in MySQL.

- **Blog Management**
  - Admin can:
    - **Create** new blog posts.
    - **Edit** existing posts.
    - **Delete** posts.
  - Blog data is stored in a dedicated blog table in MySQL.

- **Order Management**
  - Admin can view a list of all customer orders:
    - Customer name and contact information
    - Address
    - Ordered items and total amount
    - Order time
  - Can be used similarly to a **“kitchen screen”** for preparing orders.

---

### 2.3 System & Architecture

- Clear separation between:
  - `html/` – static frontend pages (Home, Shop, Login, Cart, etc.)
  - `backend/` – Node.js/Express server, routes, and controller logic
  - `database/` – SQL scripts for creating database and tables (e.g. `LandokmaiDB`, `flowers`, `users`, `orders`, `blog`).

- Uses environment variables (e.g. `.env`) to store:
  - MySQL host/user/password
  - Database name
  - Server port (e.g. `PORT=3030`)

---

## 3. Tech Stack

- **Frontend**
  - HTML5, CSS3
  - Vanilla JavaScript (DOM, events, localStorage for cart)
  - Responsive layout design

- **Backend**
  - Node.js
  - Express.js (routing, middleware)

- **Database**
  - MySQL
  - SQL scripts for:
    - Database creation (`LandokmaiDB`)
    - Tables: `flowers`, `users`, `orders`, `order_items`, `blog` (names may vary by script)

---

## 4. Project Structure

```bash
LandokmaiWeb/
├─ backend/        # Node.js + Express server, routes, controllers
├─ database/       # SQL scripts for creating and seeding MySQL database
├─ html/           # Frontend pages (Home, Shop, Login, Cart, Blog, Admin, etc.)
└─ README.md       # Project description
