const { Router } = require('express');
const { getStats, bulkCreateTag, generateUnassigned, assignEmail, getUsers, getRecentTags } = require('../controllers/jankariManagerController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// All JankariTag management routes require NIK SPACE authentication
router.get('/stats', requireAuth, getStats);
router.post('/bulk-create', requireAuth, bulkCreateTag);
router.post('/generate-retail', requireAuth, generateUnassigned);
router.post('/assign-email', requireAuth, assignEmail);
router.get('/users', requireAuth, getUsers);
router.get('/tags/recent', requireAuth, getRecentTags);

module.exports = router;
