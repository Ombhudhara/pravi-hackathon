import * as authService from '../services/auth.service.js';
import { validateSignupBody, rejectOperatorFields } from '../utils/validators.js';
import { config } from '../config/env.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Reject operator injection
    if (rejectOperatorFields(req.body, ['email', 'password'])) {
      return res.status(400).json({ success: false, message: 'Invalid request format.' });
    }

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      // Must return identical generic message as failed auth to not leak email existence
      return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    }

    let authResult;
    try {
      authResult = await authService.loginUser(email, password);
    } catch (err) {
      if (err.message === 'INACTIVE_USER') {
        return res.status(403).json({
          success: false,
          message: 'Your account is not active. It may be waiting for approval, or it may have been deactivated. Contact the administrator.'
        });
      }
      throw err;
    }

    if (!authResult) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: authResult
    });
  } catch (err) {
    next(err);
  }
}

export async function signup(req, res, next) {
  try {
    if (!config.signupEnabled) {
      return res.status(404).json({ success: false, message: 'Signup is disabled.' });
    }

    // Validate body
    const validation = validateSignupBody(req.body);
    if (validation.errors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.keys(validation.errors).map(field => ({
          field,
          message: validation.errors[field]
        }))
      });
    }

    // Check for unknown fields
    const allowedFields = ['fullName', 'email', 'department', 'requestedRole', 'password', 'confirmPassword', 'acceptTerms'];
    const unknownKeys = Object.keys(req.body).filter(key => !allowedFields.includes(key));
    if (unknownKeys.length > 0) {
      return res.status(400).json({ success: false, message: 'Invalid request format.' });
    }

    await authService.signupUser(validation.data);

    // Regardless of duplicate email, return the same success message
    res.status(201).json({
      success: true,
      message: 'Your request has been received. An administrator must approve your account before you can sign in.',
      data: null
    });

  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const { password_hash, ...user } = req.user;
    res.json({ success: true, message: 'Current user', data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  // Existing implementation
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 10 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: [{ field: 'newPassword', message: 'Password must be at least 10 characters and contain at least one letter and one number.' }] 
      });
    }

    try {
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully', data: null });
    } catch (err) {
      if (err.message === 'INVALID_CURRENT_PASSWORD') {
        return res.status(400).json({ success: false, message: 'Invalid current password' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
