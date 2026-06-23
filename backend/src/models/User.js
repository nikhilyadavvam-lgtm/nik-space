const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  emoji: {
    type: String,
    default: '⚡',
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  authorizedModules: {
    type: [String],
    default: ['notes', 'chat', 'tasks', 'finance', 'vault', 'drive', 'reminders', 'health', 'mess', 'quotes'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Remove passwordHash from JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
