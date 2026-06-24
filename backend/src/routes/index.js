const { Router } = require('express');
const { requireAuth, requireAdmin, requireModule } = require('../middleware/auth');
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
const aiRoutes = require('./ai');

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/notes', apiLimiter, requireAuth, requireModule('notes'), notesRoutes);
router.use('/chats', apiLimiter, requireAuth, requireModule('chat'), chatsRoutes);
router.use('/tasks', apiLimiter, requireAuth, requireModule('tasks'), tasksRoutes);
router.use('/vault', apiLimiter, requireAuth, requireModule('vault'), vaultRoutes);
router.use('/quotes', apiLimiter, requireAuth, requireModule('quotes'), quotesRoutes);
router.use('/search', apiLimiter, requireAuth, searchRoutes); // Inside search controller, we dynamically check modules
router.use('/docs', apiLimiter, requireAuth, requireModule('drive'), docsRoutes);
router.use('/finance', apiLimiter, requireAuth, requireModule('finance'), financeRoutes);
router.use('/mess', apiLimiter, requireAuth, requireModule('mess'), messRoutes);
router.use('/health', apiLimiter, requireAuth, requireModule('health'), healthRoutes);
router.use('/admin', apiLimiter, requireAuth, requireAdmin, adminRoutes);
router.use('/jankari', apiLimiter, requireAuth, requireAdmin, jankariRoutes);
router.use('/users', apiLimiter, requireAuth, usersRoutes);
router.use('/telemetry', apiLimiter, requireAuth, telemetryRoutes);
router.use('/ai', apiLimiter, requireAuth, aiRoutes);

module.exports = router;
