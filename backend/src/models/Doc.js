const mongoose = require('mongoose');

const docSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['document', 'personal', 'partner', 'other'],
    default: 'document',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

docSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Doc', docSchema);
