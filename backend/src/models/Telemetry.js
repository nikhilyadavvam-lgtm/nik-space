const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true,
  },
  steps: {
    type: Number,
    default: 0,
  },
  cyclingKm: {
    type: Number,
    default: 0,
  },
  heartRate: {
    avg: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
  },
  sleep: {
    duration: { type: Number, default: 0 }, // in minutes
    quality: { type: String, default: '' },
  },
  calories: {
    type: Number,
    default: 0,
  },
  source: {
    type: String,
    default: 'health_connect',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only have one entry per date (upsert friendly)
telemetrySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Telemetry', telemetrySchema);
