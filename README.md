# LandokmaiWeb 🌸  
Full-Stack Flower Shop Web Application

LandokmaiWeb is a full-stack web application designed for an online flower shop.  
This project showcases skills in **Frontend Development**, **Backend APIs**, and **Database Design**, and is structured as a learning portfolio project.

---

## 1. Overview

LandokmaiWeb simulates a real flower shop with online purchasing capabilities.  
Customers can browse flowers, add them to their cart, and place orders.  
Admins can manage products, write blog posts, and view customer orders through the backend management system.

### **Technologies Used**
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js, Express  
- **Database:** MySQL  
- **Architecture:** Separated into `frontend (html/)`, `backend/`, and `database/`

---

## 2. Main Features

---

### ⭐ **2.1 Customer Side (User)**

#### **Home Page**
- Introduction to the Landokmai flower shop.
- Navigation bar includes links to Home, Shop, Blog, Login.

#### **Shop Page**
- Displays flowers with: image, name, price, and short description.
- Retrieves product data from **MySQL** through backend API.
- Responsive and clean product card layout.

#### **Search System**
- Users can search flowers by name.
- Search queries are matched with the `flowers` table in MySQL.

#### **Shopping Cart**
- Add products to the cart.
- Shows selected items, total price, and quantities.
- Works together with checkout page.

#### **Checkout / Order Form**
Users fill in:
- Full Name  
- Address  
- Phone Number  
- Additional notes (optional)

After submission:
- Order data is sent to backend.
- Order is stored in the **MySQL database** (`orders`, `order_items`).
- A **confirmation message** appears.

#### **Blog (Customer View)**
- Users can read blog posts written by admin.
- Used for flower care tips, promotions, and shop updates.

---

### ⭐ **2.2 Admin Side**

#### **Authentication**
- Login page with email and password.
- System distinguishes between **Admin** and **User**.
- Only Admin can access backend management.

#### **Admin Dashboard**
Manage:
- Products  
- Blog Posts  
- Customer Orders  

#### **Product Management**
- Create new flower products.  
- View all products.  
- Edit product details.  
- Delete products.  
- All data stored in `flowers` table.

#### **Blog Management**
- Admin can create, edit, delete blog posts.
- Stored in blog table in MySQL.

#### **Order Management**
Admin can view:
- Customer info  
- Address  
- Ordered items  
- Total price  
- Order timestamp  

Can be used as a **kitchen order screen**.

---

## 3. System Architecture

Clear separation of layers:
- `html/` → Frontend pages  
- `backend/` → Node.js server, API routes, controllers  
- `database/` → SQL scripts for all tables and DB setup  

Environment variables stored in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=LandokmaiDB
PORT=3030
