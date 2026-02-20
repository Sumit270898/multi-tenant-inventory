import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

/**
 * Update variant stock and log movement. Uses transaction; can join an existing session.
 * @param {string} tenantId
 * @param {string} productId
 * @param {string} sku - variant sku
 * @param {number} quantity - signed delta (+ add, - subtract)
 * @param {'IN'|'OUT'|'ADJUSTMENT'} type
 * @param {string|mongoose.Types.ObjectId|null} [referenceId]
 * @param {mongoose.ClientSession} [session] - optional; if provided, runs in that transaction
 * @returns {Promise<{ product: import('mongoose').UpdateResult, movement: import('mongoose').Document }>}
 */
export async function updateStock(tenantId, productId, sku, quantity, type, referenceId = null, session = null) {
  const shouldCommit = !session;
  if (shouldCommit) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const productResult = await Product.updateOne(
      { _id: productId, tenantId, 'variants.sku': sku },
      { $inc: { 'variants.$.stock': quantity } },
      { session }
    );

    if (productResult.matchedCount === 0) {
      const err = new Error('Product or variant not found');
      err.statusCode = 404;
      throw err;
    }

    const [movement] = await StockMovement.create(
      [
        {
          tenantId,
          productId,
          variantSku: sku,
          type,
          quantity,
          referenceId,
        },
      ],
      { session }
    );

    if (shouldCommit) {
      await session.commitTransaction();
    }

    return { product: productResult, movement };
  } catch (err) {
    if (shouldCommit && session) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    if (shouldCommit && session) {
      await session.endSession();
    }
  }
}
