const Health = require('../models/Health');

exports.getHealthStats = async (req, res) => {
  try {
    const health = await Health.findOne({ userId: req.userId });
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching health stats' });
  }
};

exports.syncHealthData = async (req, res) => {
  try {
    const { 
      stepsToday, stepsWeekly, cyclingKmToday, cyclingKmWeekly,
      history, stepGoalWeekly, cyclingGoalWeekly 
    } = req.body;

    const health = await Health.findOneAndUpdate(
      { userId: req.userId },
      { 
        stepsToday, stepsWeekly, cyclingKmToday, cyclingKmWeekly,
        history, stepGoalWeekly, cyclingGoalWeekly,
        updatedAt: Date.now() 
      },
      { new: true, upsert: true }
    );

    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Server error syncing health data' });
  }
};
