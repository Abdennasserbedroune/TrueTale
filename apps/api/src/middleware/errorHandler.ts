import express from 'express';
import { logger } from '../lib/logger';

/**
 * Global error handling middleware
 * Logs errors and sends appropriate responses
 */
export function errorHandler(
  err: any,
  req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction
) {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // In production, also send to Sentry if configured
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    try {
      // Sentry integration would go here
      // const Sentry = require('@sentry/node');
      // Sentry.captureException(err);
    } catch (sentryErr) {
      logger.error('Failed to send error to Sentry', { error: sentryErr });
    }
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: err.errors 
    });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({ 
      error: `${field || 'Field'} already exists` 
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format' 
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // Don't leak error details in production
  const response: any = {
    error: message,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
