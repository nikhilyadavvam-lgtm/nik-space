const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  entryType: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense',
  },
  category: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
  description: { // Keeping for backward compatibility but using 'note' primarily
    type: String,
    default: '',
  },
  spentOn: {
    type: Date,
    default: Date.now,
  },
  date: { // Keeping for backward compatibility
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

financeSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Finance', financeSchema);
