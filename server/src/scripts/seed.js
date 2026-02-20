/**
 * Seed one tenant and one user so you can log in.
 * Run from server folder: node src/scripts/seed.js
 * Requires: MONGODB_URI and JWT_SECRET in .env (for consistency; script only uses DB).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-tenant-inventory';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  let tenant = await Tenant.findOne({ name: 'Demo Tenant' });
  if (!tenant) {
    tenant = await Tenant.create({ name: 'Demo Tenant' });
    console.log('Created tenant:', tenant.name, tenant._id);
  } else {
    console.log('Using existing tenant:', tenant.name, tenant._id);
  }

  const email = 'admin@demo.com';
  const password = 'demo123';
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 12);
    user = await User.create({
      name: 'Demo Admin',
      email,
      password: hashedPassword,
      tenantId: tenant._id,
      role: 'OWNER',
    });
    console.log('Created user:', user.email);
  } else {
    console.log('User already exists:', user.email);
  }

  console.log('\nYou can log in with:');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('\nThen open http://localhost:5173/login (with client and server running).\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
