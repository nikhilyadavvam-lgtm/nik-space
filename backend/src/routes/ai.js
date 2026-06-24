const { Router } = require('express');
const { handleChat } = require('../controllers/aiController');

const router = Router();

// POST /api/ai/chat — Chat endpoint for Personal AI Assistant
router.post('/chat', handleChat);

module.exports = router;
