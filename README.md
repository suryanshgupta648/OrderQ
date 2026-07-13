# DesiBites - Multi-Tenant SaaS POS & KOT System

DesiBites is a modern, role-based Point of Sale (POS) and Kitchen Order Ticket (KOT) system designed specifically for the restaurant industry. Originally built as a single-restaurant application, it has been evolved into a **Multi-Tenant SaaS (Software as a Service)** platform, allowing multiple restaurant businesses to securely operate on the same underlying infrastructure.

---

## 🏗️ Architecture & Tech Stack

The application is built on a decoupled, full-stack architecture:

### Frontend
- **React (Vite)**: High-performance frontend rendering.
- **Material-UI (MUI)**: Comprehensive component library for a premium, responsive design.
- **Recharts**: For dynamic analytics and data visualization.
- **React Router**: Client-side routing and protected paths.
- **Role-Based UI**: Dynamically renders navigation and features based on the logged-in user's role.

### Backend
- **Spring Boot 3 (Java 17)**: Robust backend framework handling REST APIs, business logic, and security.
- **Spring Security & JWT**: Stateless authentication via HttpOnly cookies.
- **Spring Data JPA (Hibernate)**: Object-Relational Mapping for database interactions.
- **Multi-Tenant Logic**: Intercepts `X-Restaurant-Id` headers and JWT claims to filter all database queries by `restaurant_id`.

### Database
- **PostgreSQL (Supabase)**: Cloud-hosted relational database.
- **Tenant Isolation**: Every core entity (Orders, Users, Waiter Requests, Restaurant State) is strictly tied to a `Restaurant` entity.

---

## 🚀 Key Features

### 1. Multi-Tenancy (SaaS Ready)
Multiple restaurants can sign up and use the platform simultaneously. Data is strictly isolated. When a user logs in, the backend reads their assigned `restaurant_id` from their JWT token and ensures they can only view and modify data belonging to their restaurant. 

### 2. Role-Based Access Control (RBAC)
Staff members have specific roles with restricted views:
- **MANAGER (Admin)**: Full access to the Dashboard, including financial Analytics, top-selling items, Order history, and Kitchen/Waiter queues.
- **CASHIER**: Access to active Orders, Waiter Requests, and Order History for billing. Cannot view financial analytics.
- **KITCHEN (KOT)**: A simplified, distraction-free view showing only the active order queue (Preparing vs Completed).

### 3. Contactless QR Ordering
Customers do not need to download an app or create an account. They scan a QR code placed on their table. 
- The QR code contains a unique URL (e.g., `https://desibites.com/menu?restaurant=1&table=5`).
- The frontend dynamically reads the `restaurant` ID from the URL and attaches it as an `X-Restaurant-Id` HTTP header to all backend API requests.
- The backend accepts the order and securely routes it to the correct tenant's kitchen queue.

### 4. Live Kitchen Status & Menu Management
- **Kitchen Status**: Staff can instantly toggle the kitchen status (Open/Busy/Closed), which updates the customer menu in real-time to prevent orders when overwhelmed.
- **Menu Management**: Specific menu items or entire categories can be disabled with a single click if ingredients run out.

### 5. Waiter Call System
Customers can request a waiter directly from their phone (e.g., "Need Water", "Bill Please"). These requests pop up instantly on the Cashier's dashboard.

### 6. Analytics Dashboard
A beautiful, interactive analytics suite for Managers featuring:
- Hourly Sales Trends (Area Charts)
- Category Distribution (Pie Charts)
- Top 5 Bestsellers (Bar Charts)
- Dynamic Date Filtering (Today, Yesterday, Last 7 Days, This Month)

---

## 🗄️ Database Schema

The PostgreSQL database relies on the following core entities:

1. **`Restaurant`**: The root entity for a tenant. (id, name, address, phone).
2. **`User`**: Staff accounts linked to a restaurant. (email, password_hash, role, restaurant_id).
3. **`RestaurantOrder`**: Customer orders. (id, table_number, total_amount, status, restaurant_id).
4. **`WaiterRequest`**: Ping from a table. (id, table_num, status, timestamp, restaurant_id).
5. **`RestaurantState`**: Live state of the kitchen and menu. (id, kitchen_status, disabled_items, disabled_categories, restaurant_id).

---

## 🛠️ Local Development Setup

### 1. Backend (Spring Boot)
1. Ensure Java 17+ and Maven are installed.
2. Navigate to `spring-backend/`.
3. The application uses a `DataSeeder` that will automatically create a default Restaurant and dummy staff accounts (Manager, Cashier, Kitchen) if the database is empty.
4. Run: `./mvnw spring-boot:run`
5. The API will be available at `http://localhost:8080`.

### 2. Frontend (React)
1. Ensure Node.js is installed.
2. Navigate to `frontend/`.
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`
5. The UI will be available at `http://localhost:3000` (or `5173`).

---

## 🚢 Deployment Strategy

For taking this SaaS platform live, the recommended architecture is:

1. **Database**: **Supabase** (Already configured and running).
2. **Backend API**: **Railway** or **Render**. Connect your GitHub repository to automatically build and deploy the Spring Boot `.jar` via a standard Dockerfile or Paketo Buildpacks.
3. **Frontend**: **Vercel** or **Netlify**. Connect your GitHub repository, set the build command to `npm run build`, and configure your environment variables to point to your live Railway API URL.