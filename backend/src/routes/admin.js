const { Router } = require('express');
const { getStats, getSystemInfo, getUsers, createUser, updateUserFeatures, deleteUser } = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

// All admin routes require authentication and admin role
router.get('/stats', requireAuth, requireAdmin, getStats);
router.get('/system', requireAuth, requireAdmin, getSystemInfo);
router.get('/users', requireAuth, requireAdmin, getUsers);
router.post('/users', requireAuth, requireAdmin, createUser);
router.put('/users/:id', requireAuth, requireAdmin, updateUserFeatures);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

module.exports = router;
