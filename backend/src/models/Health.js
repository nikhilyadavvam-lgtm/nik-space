const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  stepsToday: { type: Number, default: 0 },
  stepsWeekly: { type: Number, default: 0 },
  cyclingKmToday: { type: Number, default: 0 },
  cyclingKmWeekly: { type: Number, default: 0 },
  history: [{
    date: { type: String, required: true },
    steps: { type: Number, default: 0 },
    cyclingKm: { type: Number, default: 0 }
  }],
  stepGoalWeekly: { type: Number, default: 50000 },
  cyclingGoalWeekly: { type: Number, default: 100 },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Health', healthSchema);
