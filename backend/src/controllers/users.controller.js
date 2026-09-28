import * as usersService from '../services/users.service.js';
import { isValidEmail, isValidRole, isValidPassword, isValidUUID } from '../utils/validators.js';

export async function getUsers(req, res, next) {
  try {
    const { role, isActive, search, page, limit } = req.query;
    const result = await usersService.getUsers({ role, isActive, search, page, limit });
    res.json({ success: true, message: 'Users retrieved successfully', data: result });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { full_name, email, role, department, password } = req.body;
    const errors = [];

    if (!full_name) errors.push({ field: 'full_name', message: 'Required' });
    if (!email || !isValidEmail(email)) errors.push({ field: 'email', message: 'Invalid email' });
    if (!role || !isValidRole(role)) errors.push({ field: 'role', message: 'Invalid role' });
    if (!password || !isValidPassword(password)) errors.push({ field: 'password', message: 'Invalid password (min 10 chars, 1 letter, 1 number)' });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    try {
      const user = await usersService.createUser({ full_name, email, role, department, password });
      res.status(201).json({ success: true, message: 'User created successfully', data: { user } });
    } catch (err) {
      if (err.code === '23505') { // unique violation
        return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'email', message: 'Email already exists' }] });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const { full_name, role, department, is_active } = req.body;
    if (role && !isValidRole(role)) return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'role', message: 'Invalid role' }] });

    try {
      const user = await usersService.updateUser(id, { full_name, role, department, is_active }, req.user.id);
      res.json({ success: true, message: 'User updated successfully', data: { user } });
    } catch (err) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'User not found' });
      if (err.message === 'CANNOT_DEMOTE_SELF') return res.status(400).json({ success: false, message: 'Cannot deactivate or demote your own account' });
      if (err.message === 'LAST_ADMIN') return res.status(400).json({ success: false, message: 'Cannot deactivate or demote the last active admin' });
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!isValidUUID(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    if (!password || !isValidPassword(password)) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'password', message: 'Invalid password' }] });
    }

    try {
      await usersService.resetUserPassword(id, password);
      res.json({ success: true, message: 'Password reset successfully', data: null });
    } catch (err) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'User not found' });
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
