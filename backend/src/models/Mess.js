const mongoose = require('mongoose');

const messSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One meal plan per user
    index: true,
  },
  plan: {
    meals: {
      type: Map,
      of: {
        breakfast: String,
        lunch: String,
        dinner: String,
      }
    },
    settings: {
      remindersEnabled: Boolean,
      breakfast: String,
      lunch: String,
      dinner: String,
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Mess', messSchema);
