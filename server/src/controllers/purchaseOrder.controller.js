import mongoose from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import { updateStock } from '../services/stock.service.js';
import { getIO } from '../socket.js';

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, items } = req.body;
    if (!supplierId || !items?.length) {
      const err = new Error('supplierId and items array are required');
      err.statusCode = 400;
      return next(err);
    }
    const supplier = await Supplier.findOne({ _id: supplierId, tenantId: req.tenantId });
    if (!supplier) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      return next(err);
    }
    const po = await PurchaseOrder.create({
      tenantId: req.tenantId,
      supplierId,
      items: items.map(({ productId, sku, quantityOrdered, price }) => ({
        productId,
        sku,
        quantityOrdered,
        quantityReceived: 0,
        price,
      })),
      status: 'PENDING',
    });
    res.status(201).json(po);
  } catch (err) {
    next(err);
  }
};

export const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const pos = await PurchaseOrder.find({ tenantId: req.tenantId })
      .populate('supplierId', 'name contact')
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    next(err);
  }
};

export const getPurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId }).populate(
      'supplierId',
      'name contact'
    );
    if (!po) {
      const err = new Error('Purchase order not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json(po);
  } catch (err) {
    next(err);
  }
};

export const markReceived = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId }).session(
      session
    );
    if (!po) {
      const err = new Error('Purchase order not found');
      err.statusCode = 404;
      throw err;
    }
    if (po.status === 'RECEIVED') {
      const err = new Error('Purchase order already received');
      err.statusCode = 400;
      throw err;
    }
    const tenantId = req.tenantId;
    const poId = po._id;

    for (const item of po.items) {
      const qty = item.quantityOrdered;
      await updateStock(
        tenantId,
        item.productId,
        item.sku,
        qty,
        'IN',
        poId,
        session
      );
    }

    po.status = 'RECEIVED';
    po.items.forEach((it) => {
      it.quantityReceived = it.quantityOrdered;
    });
    await po.save({ session });

    await session.commitTransaction();
    try {
      getIO().emit('stockUpdated');
    } catch (_) {}
    const updated = await PurchaseOrder.findById(poId).populate('supplierId', 'name contact');
    res.json(updated);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    await session.endSession();
  }
};
