import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantSku: { type: String, required: true },
    type: { type: String, required: true, enum: ['IN', 'OUT', 'ADJUSTMENT'] },
    quantity: { type: Number, required: true },
    referenceId: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

stockMovementSchema.index({ tenantId: 1 });
stockMovementSchema.index({ tenantId: 1, createdAt: -1 });
stockMovementSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });

export default mongoose.model('StockMovement', stockMovementSchema);
