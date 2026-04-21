const Mess = require('../models/Mess');

exports.getMealPlan = async (req, res) => {
  try {
    let plan = await Mess.findOne({ userId: req.userId });
    if (!plan) {
      // Return empty or default if needed, though frontend handles defaults
      return res.json({ plan: null });
    }
    res.json({ plan: plan.plan });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching meal plan' });
  }
};

exports.saveMealPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    
    let messPlan = await Mess.findOneAndUpdate(
      { userId: req.userId },
      { plan, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    
    res.json({ plan: messPlan.plan });
  } catch (error) {
    res.status(500).json({ error: 'Server error saving meal plan' });
  }
};
