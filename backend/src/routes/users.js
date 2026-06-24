const { Router } = require('express');
const User = require('../models/User');

const router = Router();

// GET /api/users — fetch registered contacts/users except current user
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('name email emoji role profilePicture');
    res.json({ users });
  } catch (err) {
    console.error('Fetch users directory error:', err);
    res.status(500).json({ error: 'Server error fetching contacts list' });
  }
});

// PUT /api/users/push-token — save user's push token
router.put('/push-token', async (req, res) => {
  try {
    const { token } = req.body;
    await User.findByIdAndUpdate(req.userId, { expoPushToken: token || '' });
    res.json({ success: true, message: 'Push token updated' });
  } catch (err) {
    console.error('Update push token error:', err);
    res.status(500).json({ error: 'Failed to update push token' });
  }
});

module.exports = router;
