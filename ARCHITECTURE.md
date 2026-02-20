# ARCHITECTURE.md

# Multi-Tenant Inventory Management System

## 1. Multi-Tenant Strategy

### Chosen Approach: Row-Level Isolation (tenantId)

Each document contains a `tenantId` field:
- Users
- Products
- Orders
- Suppliers
- PurchaseOrders
- StockMovements

All queries are scoped using `tenantId`.

### Why I chose this approach

Pros:
- Simple and easy to implement
- Works well for SaaS MVP
- Efficient querying with proper indexing
- Easy horizontal scaling
- Single MongoDB connection

Cons:
- Developer must always enforce tenant filtering
- Not physically isolated like separate databases

### How I enforced isolation

- JWT contains tenantId
- Custom `tenantMiddleware` injects tenantId into request
- All queries automatically include tenantId
- Index created on `tenantId` for every major collection

If scaling requires stronger isolation in future, migration to database-per-tenant is possible.

---

## 2. Data Modeling Decisions

### 2.1 Product & Variants

Variants are embedded inside Product document.

Example structure:

Product:
- name
- description
- tenantId
- variants[]
    - sku
    - attributes (size, color)
    - stock
    - price

### Why embedded variants?

- Variants are tightly coupled with product
- Always queried together
- Enables atomic stock updates
- Avoids extra joins
- Keeps read operations fast

Trade-off:
- Large product documents if too many variants
- Acceptable for inventory use case

---

### 2.2 Stock Movement Tracking

Created a separate `StockMovement` collection.

Each stock change (sale, purchase, return, adjustment) creates a movement record.

Why?

- Full audit trail
- Easier analytics
- Avoids direct blind stock updates
- Helps debugging inconsistencies

Stock is never updated without recording movement.

---

### 2.3 Orders

Order contains:
- items[]
- status
- totalAmount
- tenantId

Handles:
- Partial fulfillment
- Cancellation
- Insufficient stock validation

---

### 2.4 Purchase Orders

Purchase Orders track:
- supplier
- items
- quantityOrdered
- quantityReceived
- status (Draft → Sent → Confirmed → Received)

Stock updates only when items are marked received.

Handles:
- Partial deliveries
- Price variance tracking

---

## 3. Concurrency Handling

### Problem:
Two users ordering the last item at the same time.

### Solution:
Used MongoDB Transactions + Atomic Updates.

Stock update logic:
- Conditional update using `$gte`
- `$inc` operator
- Transaction session

If stock is insufficient, operation fails and transaction aborts.

This guarantees:
- No negative stock
- No race conditions
- Data consistency

---

## 4. Smart Low-Stock Alerts

Low-stock logic considers:

currentStock + pendingConfirmedPurchaseOrders

Alert shown only if:
(currentStock + incomingStock) <= threshold

Prevents unnecessary alerts when replenishment is already on the way.

---

## 5. Dashboard & Performance Optimization

Requirement: < 2 seconds for 10,000+ products.

### Performance Strategies:

1. Proper Indexing:
   - tenantId
   - createdAt
   - variants.sku
   - order date

2. Aggregation Pipelines:
   - Inventory value calculation
   - Top 5 sellers (30 days)
   - Stock movement graph (7 days)

3. Lean Queries:
   - Used `.lean()` where possible
   - Avoided unnecessary population

4. Modular Monolith Structure:
   - Clear service layer
   - Scalable architecture

---

## 6. Role-Based Access Control

Roles:
- OWNER
- MANAGER
- STAFF

Authorization middleware restricts access based on role.

Example:
- Only Owner can manage users
- Staff cannot create Purchase Orders

---

## 7. Real-Time Updates

Used Socket.io for:
- Order creation
- Stock updates
- Purchase order receipt

Improves UX without complex architecture.

---

## 8. Scalability Considerations

If system scales:

- Shard by tenantId
- Move analytics to separate read replica
- Introduce Redis caching for dashboard
- Convert to microservices if necessary

Current structure supports smooth migration.

---

## 9. Trade-offs & Improvements

Given more time, I would:

- Add Redis caching
- Add unit & integration tests
- Add audit logging for user actions
- Add rate limiting
- Add pagination optimization
- Improve UI/UX

---

## Conclusion

The system is designed as a scalable SaaS-ready modular monolith with strong data isolation, safe concurrency handling, and optimized performance.

Focus was on correctness, consistency, and clear architectural decisions rather than overengineering.