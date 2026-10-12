import { describe, it, expect, beforeEach, vi } from 'vitest';
import server from '../../server.js';

const { db, addNotification } = server;

describe('Notification helper - unit tests', () => {
  beforeEach(() => {
    db.query = vi.fn((sql, values, callback) => callback(null, { insertId: 1 }));
  });

  it('inserts a notification row with the provided data', () => {
    addNotification(7, 'Welcome Back!', 'Testing notification helper', 'success');

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, FALSE, NOW())',
      [7, 'Welcome Back!', 'Testing notification helper', 'success'],
      expect.any(Function)
    );
  });

  it('should fail when the title does not match the expected notification value', () => {
    addNotification(7, 'Wrong Title', 'This should fail intentionally', 'info');

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, FALSE, NOW())',
      [7, 'Welcome Back!', 'This should fail intentionally', 'info'],
      expect.any(Function)
    );
  });
});
