import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/signup', signupLimiter, authController.signup);

router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
