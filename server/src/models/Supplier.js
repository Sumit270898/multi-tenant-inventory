import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true },
    contact: { type: String, default: '' },
  },
  { timestamps: true }
);

supplierSchema.index({ tenantId: 1 });

export default mongoose.model('Supplier', supplierSchema);
