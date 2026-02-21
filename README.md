# Multi-Tenant Inventory Management System

A SaaS-based inventory management platform where multiple businesses manage inventory, suppliers, and orders independently with complete data isolation.

Built using:
- Node.js
- Express
- MongoDB
- React
- Socket.io
- JWT Authentication

---

## Features Implemented

### Multi-Tenant Architecture
- Row-level isolation using tenantId
- Multiple tenants supported
- Separate users per tenant
- Role-based access control

### Inventory Management
- Products with multiple variants (size, color, etc.)
- Independent stock per SKU
- Full stock movement tracking
- Smart low-stock alerts (considering pending POs)

### Orders
- Concurrency-safe order processing
- Prevents negative stock
- Handles cancellation
- Transaction-based updates

### Suppliers & Purchase Orders
- Supplier management
- Purchase Orders with status tracking
- Partial delivery handling
- Automatic stock update on receipt

### Dashboard & Analytics
- Inventory value calculation
- Low-stock items
- Top 5 sellers (last 30 days)
- Stock movement graph (7 days)
- Optimized for 10,000+ products

### Real-Time Updates
- Socket.io integration for live stock & order updates

---

## Tech Stack

Backend:
- Node.js
- Express
- MongoDB + Mongoose
- JWT Authentication
- MongoDB Transactions
- Socket.io

Frontend:
- React (Hooks)
- Context API
- React Router
- Axios

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- MongoDB (local or connection string)

### 2. Clone Repository

```bash
git clone <your-repo-url>
cd multi-tenant-inventory
```

---

### 3. Backend Setup

cd server
npm install

Create `.env` file using `.env.example`

Example:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory
JWT_SECRET=your_secret_key

Run:

npm run dev

---

### 4. Seed Database

```bash
cd server
node src/scripts/seed.js
```

This creates:
- **2 tenants:** Acme Corp, Beta Inc
- **6 users** (3 per tenant): Owner, Manager, Staff

---

### Test Credentials

Password for all users: `demo123`

| Tenant    | Role   | Email             |
|-----------|--------|-------------------|
| Acme Corp | Owner  | `owner1@test.com` |
| Acme Corp | Manager| `manager1@test.com` |
| Acme Corp | Staff  | `staff1@test.com` |
| Beta Inc  | Owner  | `owner2@test.com` |
| Beta Inc  | Manager| `manager2@test.com` |
| Beta Inc  | Staff  | `staff2@test.com` |

---

### 5. Frontend Setup

cd client
npm install
npm run dev

---

## Assumptions Made

- Single MongoDB instance
- Tenant isolation via row-level security
- Basic UI prioritizing functionality over design
- Stock threshold fixed per variant

---

## Known Limitations

- No automated testing
- No Redis caching
- Basic UI styling
- No advanced search optimization

---

## Time Breakdown (Approx. 18 Hours)

Backend Setup & Auth – 3 hours
Multi-Tenant & Roles – 2 hours
Products & Variants – 3 hours
Orders & Concurrency – 4 hours
Purchase Orders – 3 hours
Dashboard & Optimization – 2 hours
Frontend – 1 hour

---

## Future Improvements

- Redis caching
- Background jobs for alerts
- Advanced reporting
- Multi-language support
- Deployment with CI/CD

---

## Final Note

The focus of this implementation was correctness, concurrency safety, and clear architectural decisions while keeping the system scalable and maintainable.