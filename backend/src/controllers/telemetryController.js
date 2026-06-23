const Telemetry = require('../models/Telemetry');

// POST /api/telemetry/health — sync batch daily telemetry logs
exports.saveTelemetry = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Payload must contain entries array' });
    }

    const results = [];
    for (const entry of entries) {
      const { date, steps, cyclingKm, heartRate, sleep, calories, source } = entry;
      if (!date) continue;

      const updateData = {
        steps: steps !== undefined ? steps : 0,
        cyclingKm: cyclingKm !== undefined ? cyclingKm : 0,
        calories: calories !== undefined ? calories : 0,
        source: source || 'health_connect',
      };

      if (heartRate) updateData.heartRate = heartRate;
      if (sleep) updateData.sleep = sleep;

      // Upsert by compound unique index (userId + date)
      const doc = await Telemetry.findOneAndUpdate(
        { userId: req.userId, date },
        { $set: updateData },
        { upsert: true, new: true }
      );
      results.push(doc);
    }

    res.status(200).json({ message: 'Telemetry synchronized successfully', count: results.length });
  } catch (error) {
    console.error('Save telemetry error:', error);
    res.status(500).json({ error: 'Server error saving health telemetry data' });
  }
};

// GET /api/telemetry/health — retrieve historical metric logs
exports.getTelemetry = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { userId: req.userId };
    
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const entries = await Telemetry.find(filter).sort({ date: -1 });
    res.json({ entries });
  } catch (err) {
    console.error('Get telemetry error:', err);
    res.status(500).json({ error: 'Server error retrieving telemetry entries' });
  }
};
