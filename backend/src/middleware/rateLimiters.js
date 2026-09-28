import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => {
    const email = (req.body && typeof req.body.email === 'string')
      ? req.body.email.trim().toLowerCase()
      : 'unknown';
    return `${req.ip}:${email}`;
  },
  handler: (_req, res) => {
    res.set('Retry-After', String(15 * 60));
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 15 minutes before trying again.'
    });
  }
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => req.ip,
  handler: (_req, res) => {
    res.set('Retry-After', String(60 * 60));
    res.status(429).json({
      success: false,
      message: 'Too many signup attempts. Please wait one hour before trying again.'
    });
  }
});
