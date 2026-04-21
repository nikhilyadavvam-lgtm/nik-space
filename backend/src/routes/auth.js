const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const { login, getMe, updateProfile } = require('../controllers/authController');

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  emoji: z.string().optional(),
});

// Routes (no register — single user, seeded via `npm run seed`)
router.post('/login',    authLimiter, validate(loginSchema),        login);
router.get('/me',        requireAuth,                               getMe);
router.put('/profile',   requireAuth, validate(updateProfileSchema), updateProfile);

module.exports = router;
