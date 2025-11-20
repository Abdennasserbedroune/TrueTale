import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { connectDB, disconnectDB, User } from '@truetale/db';

describe('Admin API', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let adminToken: string;
  let regularUserToken: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
    
    await connectDB();

    // Create app
    const appInstance = createApp({
      jwtSecret: 'test-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      clientOrigin: 'http://localhost:3000',
    });
    app = appInstance.app;

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123',
      role: 'writer',
      roles: ['admin'],
    });

    // Create regular user
    const regularUser = await User.create({
      email: 'user@test.com',
      username: 'testuser',
      password: 'password123',
      role: 'reader',
    });
    regularUserId = regularUser._id.toString();

    // Login admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLoginRes.body.accessToken;

    // Login regular user
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    regularUserToken = userLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await disconnectDB();
    await mongoServer.stop();
  });

  describe('User Management', () => {
    it('should list users for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should deny access to regular users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.status).toBe(403);
    });

    it('should ban a user', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${regularUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban reason' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('banned');
      expect(res.body.user.isBanned).toBe(true);
      expect(res.body.user.banReason).toBe('Test ban reason');
    });

    it('should unban a user', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${regularUserId}/unban`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('unbanned');
      expect(res.body.user.isBanned).toBe(false);
    });
  });

  describe('Platform Reports', () => {
    it('should get earnings report', async () => {
      const res = await request(app)
        .get('/api/v1/admin/earnings-report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalGrossRevenue');
      expect(res.body).toHaveProperty('platformFeeRevenue');
      expect(res.body).toHaveProperty('totalOrders');
    });
  });
});
