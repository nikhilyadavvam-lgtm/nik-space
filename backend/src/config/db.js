const mongoose = require('mongoose');

// Primary connection for NIK SPACE
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ NIK SPACE MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ NIK SPACE MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Secondary connection for JankariTag
let jankariConn = null;

const getJankariConnection = () => {
  if (jankariConn) return jankariConn;

  try {
    jankariConn = mongoose.createConnection(process.env.JANKARITAG_MONGODB_URI);
    jankariConn.on('connected', () => console.log('✅ JankariTag MongoDB connected'));
    jankariConn.on('error', (err) => console.error('❌ JankariTag MongoDB error:', err.message));
    return jankariConn;
  } catch (err) {
    console.error('❌ Failed to establish JankariTag connection:', err.message);
    return null;
  }
};

module.exports = { connectDB, getJankariConnection };
