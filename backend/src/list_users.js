const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./models/User');

async function listUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    const users = await User.find();
    console.log('\n👥 User Directory:');
    users.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Modules: ${u.authorizedModules.join(', ')}`);
    });
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

listUsers();
