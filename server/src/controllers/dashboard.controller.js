import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import StockMovement from '../models/StockMovement.js';

const LOW_STOCK_THRESHOLD = 10;
const TOP_SELLERS_DAYS = 30;
const STOCK_MOVEMENT_DAYS = 7;

const toObjectId = (id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id));

/**
 * Total inventory value: sum of (variant.stock * variant.price) for all products.
 * Uses index: { tenantId: 1 }
 */
export const getInventoryValue = async (req, res, next) => {
  try {
    const tenantId = toObjectId(req.tenantId);
    const [result] = await Product.aggregate([
      { $match: { tenantId } },
      { $unwind: '$variants' },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$variants.stock', '$variants.price'] } },
        },
      },
      { $project: { _id: 0, totalValue: 1 } },
    ]);
    res.json({ totalValue: result?.totalValue ?? 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * Variants with stock below threshold. Uses index: { tenantId: 1 }
 */
export const getLowStock = async (req, res, next) => {
  try {
    const tenantId = toObjectId(req.tenantId);
    const threshold = Number(req.query.threshold) || LOW_STOCK_THRESHOLD;
    const items = await Product.aggregate([
      { $match: { tenantId } },
      { $unwind: '$variants' },
      { $match: { 'variants.stock': { $lt: threshold } } },
      {
        $project: {
          productId: '$_id',
          productName: '$name',
          sku: '$variants.sku',
          stock: '$variants.stock',
          price: '$variants.price',
        },
      },
      { $sort: { stock: 1 } },
    ]);
    res.json({ items, threshold });
  } catch (err) {
    next(err);
  }
};

/**
 * Top 5 sellers by quantity sold in last 30 days (CONFIRMED orders).
 * Uses index: { tenantId: 1, createdAt: -1 }
 */
export const getTopSellers = async (req, res, next) => {
  try {
    const tenantId = toObjectId(req.tenantId);
    const days = Number(req.query.days) || TOP_SELLERS_DAYS;
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const from = new Date();
    from.setDate(from.getDate() - days);

    const top = await Order.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', createdAt: { $gte: from } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: { productId: '$items.productId', variantSku: '$items.variantSku' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id.productId',
          foreignField: '_id',
          as: 'product',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $project: {
          productId: '$_id.productId',
          variantSku: '$_id.variantSku',
          quantitySold: 1,
          revenue: 1,
          productName: { $arrayElemAt: ['$product.name', 0] },
        },
      },
    ]);
    res.json({ items: top, days });
  } catch (err) {
    next(err);
  }
};

/**
 * Stock movement summary for last 7 days: by type and by day.
 * Uses index: { tenantId: 1, createdAt: -1 }
 */
export const getStockMovement = async (req, res, next) => {
  try {
    const tenantId = toObjectId(req.tenantId);
    const days = Number(req.query.days) || STOCK_MOVEMENT_DAYS;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const [byType, byDay] = await Promise.all([
      StockMovement.aggregate([
        { $match: { tenantId, createdAt: { $gte: from } } },
        { $group: { _id: '$type', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
        { $project: { type: '$_id', count: 1, totalQuantity: 1, _id: 0 } },
      ]),
      StockMovement.aggregate([
        { $match: { tenantId, createdAt: { $gte: from } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type',
            },
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
        { $sort: { '_id.date': 1 } },
        {
          $project: {
            date: '$_id.date',
            type: '$_id.type',
            count: 1,
            totalQuantity: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    res.json({ byType, byDay, days });
  } catch (err) {
    next(err);
  }
};
