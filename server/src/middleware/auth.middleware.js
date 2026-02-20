import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Not authorized');
    err.statusCode = 401;
    return next(err);
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role };
    next();
  } catch {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    next(err);
  }
};
