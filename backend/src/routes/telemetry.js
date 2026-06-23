const { Router } = require('express');
const { saveTelemetry, getTelemetry } = require('../controllers/telemetryController');

const router = Router();

// Routes mounted at /api/telemetry
router.get('/health', getTelemetry);
router.post('/health', saveTelemetry);

module.exports = router;
