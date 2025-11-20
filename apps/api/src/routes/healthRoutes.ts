import express from 'express';
import mongoose from 'mongoose';
import { logger } from '../lib/logger';

const router = express.Router();

/**
 * Enhanced health check endpoint
 * Returns comprehensive system status
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Perform a simple DB query to verify it's responsive
    let dbResponsive = false;
    let dbLatency = 0;
    
    if (dbStatus === 'connected' && mongoose.connection.db) {
      const dbCheckStart = Date.now();
      try {
        await mongoose.connection.db.admin().ping();
        dbResponsive = true;
        dbLatency = Date.now() - dbCheckStart;
      } catch (err) {
        logger.error('Database ping failed', { error: err });
      }
    }

    const responseTime = Date.now() - startTime;

    const health = {
      status: dbStatus === 'connected' && dbResponsive ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: {
        status: dbStatus,
        responsive: dbResponsive,
        latency: `${dbLatency}ms`,
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
      environment: process.env.NODE_ENV || 'development',
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err: any) {
    logger.error('Health check failed', { error: err.message });
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Simple readiness probe
 */
router.get('/ready', (req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  if (isReady) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

/**
 * Simple liveness probe
 */
router.get('/alive', (req, res) => {
  res.status(200).json({ alive: true });
});

export { router as healthRoutes };
