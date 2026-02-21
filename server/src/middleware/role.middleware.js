/**
 * Restrict route access to specific roles.
 * Must run after protect (so req.user exists).
 * @param {...string} allowedRoles - e.g. requireRole('OWNER') or requireRole('OWNER', 'MANAGER')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      const err = new Error('Not authorized');
      err.statusCode = 403;
      return next(err);
    }
    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error('Forbidden: insufficient role');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
};
