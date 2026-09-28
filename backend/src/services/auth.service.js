import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { config } from '../config/env.js';

// Pre-computed dummy hash so that a login for a non-existent user
// takes roughly the same time as one for a real user.
const DUMMY_HASH = await bcrypt.hash('dummy_password_for_timing', 12);

export async function loginUser(email, password) {
  const user = await User.findOne({ email: String(email).toLowerCase() });

  // Always run bcrypt.compare to prevent timing attacks.
  const hashToCompare = user ? user.password_hash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) {
    return null;
  }

  if (!user.is_active) {
    throw new Error('INACTIVE_USER');
  }

  // Update last login
  user.last_login_at = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department || null
    }
  };
}

export async function signupUser({ fullName, email, department, requestedRole, password }) {
  // Check if email already exists. If it does, return silently (no reveal).
  const existing = await User.findOne({ email });
  if (existing) {
    // Hash the password anyway to keep timing consistent
    await bcrypt.hash(password, 12);
    return { duplicate: true };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await User.create({
      full_name: fullName,
      email,
      password_hash: passwordHash,
      role: requestedRole,
      department,
      is_active: false
    });
  } catch (err) {
    // Duplicate key error from MongoDB unique index (race condition)
    if (err.code === 11000) {
      return { duplicate: true };
    }
    throw err;
  }

  return { duplicate: false };
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('password_hash');
  if (!user) throw new Error('User not found');

  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new Error('INVALID_CURRENT_PASSWORD');
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  user.password_hash = newHash;
  await user.save();
}
