import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ['OWNER', 'MANAGER', 'STAFF'],
    },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ tenantId: 1 });

export default mongoose.model('User', userSchema);
