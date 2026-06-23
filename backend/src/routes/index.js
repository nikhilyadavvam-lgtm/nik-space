const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const authRoutes = require('./auth');
const notesRoutes = require('./notes');
const chatsRoutes = require('./chats');
const tasksRoutes = require('./tasks');
const vaultRoutes = require('./vault');
const quotesRoutes = require('./quotes');
const searchRoutes = require('./search');
const docsRoutes = require('./docs');
const financeRoutes = require('./finance');
const messRoutes = require('./mess');
const healthRoutes = require('./health');
const adminRoutes = require('./admin');
const jankariRoutes = require('./jankari');
const usersRoutes = require('./users');
const telemetryRoutes = require('./telemetry');

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/notes', apiLimiter, requireAuth, notesRoutes);
router.use('/chats', apiLimiter, requireAuth, chatsRoutes);
router.use('/tasks', apiLimiter, requireAuth, tasksRoutes);
router.use('/vault', apiLimiter, requireAuth, vaultRoutes);
router.use('/quotes', apiLimiter, requireAuth, quotesRoutes);
router.use('/search', apiLimiter, requireAuth, searchRoutes);
router.use('/docs', apiLimiter, requireAuth, docsRoutes);
router.use('/finance', apiLimiter, requireAuth, financeRoutes);
router.use('/mess', apiLimiter, requireAuth, messRoutes);
router.use('/health', apiLimiter, requireAuth, healthRoutes);
router.use('/admin', apiLimiter, requireAuth, adminRoutes);
router.use('/jankari', apiLimiter, requireAuth, jankariRoutes);
router.use('/users', apiLimiter, requireAuth, usersRoutes);
router.use('/telemetry', apiLimiter, requireAuth, telemetryRoutes);

module.exports = router;
