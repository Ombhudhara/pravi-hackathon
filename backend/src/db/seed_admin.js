import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/db.js';
import { config } from '../config/env.js';
import { User } from '../models/index.js';

async function seedAdmin() {
  if (!config.seedAdminEmail || !config.seedAdminPassword || !config.seedAdminName) {
    throw new Error('SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, and SEED_ADMIN_NAME must be set to run the seeder.');
  }
  await connectDB();
  try {
    const existing = await User.findOne({ email: config.seedAdminEmail.toLowerCase() });
    if (existing) {
      console.log('Admin user already exists. Skipping seed.');
      return;
    }
    const password_hash = await bcrypt.hash(config.seedAdminPassword, 12);
    await User.create({ full_name: config.seedAdminName, email: config.seedAdminEmail, password_hash, role: 'ADMIN' });
    console.log('Successfully created initial ADMIN user.');
  } finally {
    await disconnectDB();
  }
}

seedAdmin().catch((error) => {
  console.error('Error seeding admin user:', error);
  process.exitCode = 1;
});
