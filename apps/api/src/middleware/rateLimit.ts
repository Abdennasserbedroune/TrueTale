import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * 5 requests per 15 minutes to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * General API rate limiter
 * 30 requests per minute for regular endpoints
 */
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Admins bypass rate limits
    const roles = (req as any).user?.roles || [];
    return roles.includes('admin');
  },
});

/**
 * Rate limiter for costly operations
 * 10 requests per minute for uploads, searches, etc.
 */
export const costlyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests
  message: 'Rate limited for this operation, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Admins bypass rate limits
    const roles = (req as any).user?.roles || [];
    return roles.includes('admin');
  },
});
