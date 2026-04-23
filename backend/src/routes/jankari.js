const { Router } = require('express');
const { getStats, bulkCreateTag, generateUnassigned, assignEmail } = require('../controllers/jankariManagerController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// All JankariTag management routes require NIK SPACE authentication
router.get('/stats', requireAuth, getStats);
router.post('/bulk-create', requireAuth, bulkCreateTag);
router.post('/generate-retail', requireAuth, generateUnassigned);
router.post('/assign-email', requireAuth, assignEmail);

module.exports = router;
