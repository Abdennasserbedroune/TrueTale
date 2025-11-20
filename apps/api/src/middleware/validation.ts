import express from 'express';
import { z } from 'zod';

/**
 * Request body validation middleware
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.issues.map(e => ({ 
            path: e.path.join('.'), 
            message: e.message 
          })),
        });
      }
      res.status(400).json({ error: 'Invalid request' });
    }
  };
}

/**
 * Query parameter validation middleware
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: err.issues.map(e => ({ 
            path: e.path.join('.'), 
            message: e.message 
          })),
        });
      }
      res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(req: express.Request, res: express.Response, next: express.NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj.replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key] = sanitize(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  next();
}
