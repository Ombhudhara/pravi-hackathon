export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Missing or invalid token' });
    }
    
    // Allow all authenticated roles to access all endpoints
    next();
  };
}
