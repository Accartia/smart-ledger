import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import server from '../../server.js';

const { app, db } = server;

describe('Backend integration tests', () => {
  beforeEach(() => {
    const hashedPassword = bcrypt.hashSync('secret123', 10);

    db.query = vi.fn((queryString, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      if (queryString.includes('SELECT * FROM users')) {
        return callback(null, [{
          user_id: 12,
          email: 'customer@example.com',
          password: hashedPassword,
          role: 'customer',
          username: 'customer',
        }]);
      }

      if (queryString.includes('UPDATE users SET last_login')) {
        return callback(null, { affectedRows: 1 });
      }

      if (queryString.includes('SELECT * FROM customers')) {
        return callback(null, [{
          customer_id: 42,
          user_id: 12,
          full_name: 'Jane Smith',
          email: 'customer@example.com',
        }]);
      }

      if (queryString.includes('INSERT INTO notifications')) {
        return callback(null, { insertId: 1 });
      }

      return callback(null, []);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/test returns the backend health message', async () => {
    const response = await request(app).get('/api/test');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Backend is working!' });
  });

  it('POST /api/login returns success for a valid customer login', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'customer@example.com',
        password: 'secret123',
        role: 'customer',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('customer@example.com');
    expect(response.body.user.role).toBe('customer');
  });
});
