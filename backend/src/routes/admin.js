const { Router } = require('express');
const { getStats, getSystemInfo } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// All admin routes require authentication
router.get('/stats', requireAuth, getStats);
router.get('/system', requireAuth, getSystemInfo);

module.exports = router;
