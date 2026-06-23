/**
 * Seed Script — Creates the single owner user for NIK SPACE.
 * 
 * Usage:
 *   node src/seed.js
 * 
 * Set these in your .env:
 *   OWNER_EMAIL=your@email.com
 *   OWNER_PASSWORD=yourpassword
 *   OWNER_NAME=YourName
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'nikhil@nikspace.app';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'himanshunikhil@2110';
const OWNER_NAME = process.env.OWNER_NAME || 'Nikhil';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing user if any (fresh seed)
    const deleted = await User.deleteMany({ email: OWNER_EMAIL });
    if (deleted.deletedCount > 0) {
      console.log(`🗑️  Removed old user "${OWNER_EMAIL}"`);
    }

    // Create the owner
    const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);
    const user = await User.create({
      email: OWNER_EMAIL,
      passwordHash,
      name: OWNER_NAME,
      emoji: '⚡',
      role: 'admin',
    });

    console.log('✅ Owner user created:');
    console.log(`   Email: ${OWNER_EMAIL}`);
    console.log(`   Name:  ${OWNER_NAME}`);
    console.log(`   ID:    ${user._id}`);
    console.log('\n🔑 Use these credentials to sign in.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
