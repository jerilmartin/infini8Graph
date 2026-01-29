import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/login', authController.login);
router.get('/callback', authController.callback);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authenticate, authController.refreshToken);

// Multi-account routes
router.get('/accounts', authenticate, authController.getAccounts);
router.post('/switch/:accountId', authenticate, authController.switchAccount);

export default router;
