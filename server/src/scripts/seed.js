/**
 * Seed 2 tenants with users in different roles (Owner, Manager, Staff).
 * Run from server folder: node src/scripts/seed.js
 * Requires: MONGODB_URI in .env (script only uses DB).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-tenant-inventory';

const DEFAULT_PASSWORD = 'demo123';

const SEED_DATA = [
  {
    tenantName: 'Acme Corp',
    users: [
      { name: 'Acme Owner', email: 'owner1@test.com', role: 'OWNER' },
      { name: 'Acme Manager', email: 'manager1@test.com', role: 'MANAGER' },
      { name: 'Acme Staff', email: 'staff1@test.com', role: 'STAFF' },
    ],
  },
  {
    tenantName: 'Beta Inc',
    users: [
      { name: 'Beta Owner', email: 'owner2@test.com', role: 'OWNER' },
      { name: 'Beta Manager', email: 'manager2@test.com', role: 'MANAGER' },
      { name: 'Beta Staff', email: 'staff2@test.com', role: 'STAFF' },
    ],
  },
];

async function ensureUser(tenantId, { name, email, role }) {
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      tenantId,
      role,
    });
    console.log('  Created user:', email, `(${role})`);
  } else {
    console.log('  User already exists:', email);
  }
  return user;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);

  console.log('Seeding tenants and users...\n');

  for (const { tenantName, users } of SEED_DATA) {
    let tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      tenant = await Tenant.create({ name: tenantName });
      console.log('Created tenant:', tenant.name);
    } else {
      console.log('Using existing tenant:', tenant.name);
    }

    for (const u of users) {
      await ensureUser(tenant._id, u);
    }
    console.log('');
  }

  console.log('Done. You can log in with any of the credentials below.');
  console.log('Password for all users:', DEFAULT_PASSWORD);
  console.log('\nThen open http://localhost:5173/login (with client and server running).\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
