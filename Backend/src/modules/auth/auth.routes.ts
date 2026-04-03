// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
router.post('/register', authLimiter, validate(registerSchema), (req, res, next) =>
    authController.register(req, res, next),
);

/**
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) =>
    authController.login(req, res, next),
);

/**
 * @route   POST /api/v1/auth/logout
 * @access  Authenticated
 */
router.post('/logout', authenticate, (req, res, next) =>
    authController.logout(req, res, next),
);

/**
 * @route   GET /api/v1/auth/me
 * @access  Authenticated
 */
router.get('/me', authenticate, (req, res, next) =>
    authController.me(req, res, next),
);

export default router;