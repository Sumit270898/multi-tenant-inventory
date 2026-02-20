import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    quantityOrdered: { type: Number, required: true, min: 1 },
    quantityReceived: { type: Number, default: 0 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [purchaseOrderItemSchema],
    status: { type: String, required: true, enum: ['PENDING', 'CONFIRMED', 'RECEIVED'], default: 'PENDING' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

purchaseOrderSchema.index({ tenantId: 1 });
purchaseOrderSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
