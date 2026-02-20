import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    stock: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    variants: [variantSchema],
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1 });
productSchema.index({ tenantId: 1, 'variants.sku': 1 }, { unique: true });

export default mongoose.model('Product', productSchema);
