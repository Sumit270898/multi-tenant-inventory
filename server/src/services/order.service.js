import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import StockMovement from '../models/StockMovement.js';

/**
 * Create order: reserve stock (conditional update with $gte), create order, log movements.
 * All in one transaction; aborts on any failure (e.g. insufficient stock).
 * @param {string} tenantId
 * @param {{ productId: string, variantSku: string, quantity: number, price: number }[]} items
 * @returns {Promise<import('mongoose').Document>} created order
 */
export async function createOrder(tenantId, items) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Conditional update: reduce stock only where stock >= quantity (concurrency safe)
    for (const item of items) {
      const { productId, variantSku, quantity } = item;
      const result = await Product.updateOne(
        { _id: productId, tenantId },
        { $inc: { 'variants.$[v].stock': -quantity } },
        {
          arrayFilters: [{ 'v.sku': variantSku, 'v.stock': { $gte: quantity } }],
          session,
        }
      );

      if (result.modifiedCount === 0) {
        const err = new Error(
          `Insufficient stock or variant not found: product ${productId}, sku ${variantSku}, requested ${quantity}`
        );
        err.statusCode = 409;
        throw err;
      }
    }

    // 2. Create order to get orderId
    const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
    const orderDoc = {
      tenantId,
      items: items.map(({ productId, variantSku, quantity, price }) => ({
        productId,
        variantSku,
        quantity,
        price,
      })),
      status: 'CONFIRMED',
      totalAmount,
    };
    const [order] = await Order.create([orderDoc], { session });
    const orderId = order._id;

    // 3. Log stock movements (OUT) for each item
    await StockMovement.insertMany(
      items.map(({ productId, variantSku, quantity }) => ({
        tenantId,
        productId,
        variantSku,
        type: 'OUT',
        quantity: -quantity,
        referenceId: orderId,
      })),
      { session }
    );

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}
