const { Router } = require('express');
const User = require('../models/User');

const router = Router();

// GET /api/users — fetch registered contacts/users except current user
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('name email emoji role');
    res.json({ users });
  } catch (err) {
    console.error('Fetch users directory error:', err);
    res.status(500).json({ error: 'Server error fetching contacts list' });
  }
});

module.exports = router;
