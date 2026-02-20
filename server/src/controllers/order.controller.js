import Order from '../models/Order.js';
import { createOrder } from '../services/order.service.js';
import { getIO } from '../socket.js';

/**
 * GET /api/orders
 * Returns all orders for the tenant, newest first.
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ tenantId: req.tenantId })
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/orders
 * Body: { items: [{ productId, variantSku, quantity, price }] }
 * Uses req.tenantId from protectWithTenant.
 */
export const createOrderHandler = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      const err = new Error('items array is required and must not be empty');
      err.statusCode = 400;
      return next(err);
    }
    for (const it of items) {
      if (!it.productId || !it.variantSku || it.quantity == null || it.price == null) {
        const err = new Error('Each item must have productId, variantSku, quantity, and price');
        err.statusCode = 400;
        return next(err);
      }
    }
    const order = await createOrder(req.tenantId, items);
    try {
      getIO().emit('orderCreated');
      getIO().emit('stockUpdated');
    } catch (_) {}
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};
