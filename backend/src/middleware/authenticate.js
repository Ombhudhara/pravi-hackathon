import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/index.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, config.jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Missing or invalid token' });
    }

    try {
      const user = await User.findById(decoded.id)
        .select('email role is_active department full_name')
        .lean();

      if (!user) {
        return res.status(401).json({ success: false, message: 'Missing or invalid token' });
      }

      if (!user.is_active) {
        return res.status(401).json({ success: false, message: 'Account is inactive' });
      }

      req.user = { ...user, id: String(user._id) };
      delete req.user._id;
      next();
    } catch (dbErr) {
      next(dbErr);
    }
  });
}
