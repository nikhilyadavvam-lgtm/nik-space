const { Router } = require('express');
const { getHealthStats, syncHealthData } = require('../controllers/healthController');

const router = Router();

router.get('/', getHealthStats);
router.post('/sync', syncHealthData);

module.exports = router;
