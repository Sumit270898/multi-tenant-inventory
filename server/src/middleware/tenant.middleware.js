import { protect } from './auth.middleware.js';

/**
 * Attach tenantId from JWT (req.user) to request.
 * Must run after auth.middleware protect.
 */
export const setTenantId = (req, res, next) => {
  if (!req.user?.tenantId) {
    const err = new Error('Not authorized');
    err.statusCode = 401;
    return next(err);
  }
  req.tenantId = req.user.tenantId;
  next();
};

/** Protect + setTenantId. Use on routes where controllers need req.tenantId and req.user. */
export const protectWithTenant = [protect, setTenantId];
