import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createToken, verifyToken, hashString, compareString } from '../server/utils/helpers';
import type { User } from '@prisma/client';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXP_DYS = '7d';

describe('Authentication System', () => {
  describe('JWT Token Creation and Verification', () => {
    const mockUser: Partial<User> = {
      id: 1,
      email: 'test@example.com',
      role: 'ADMIN',
      tenantId: 'tenant-123'
    };

    it('should create a JWT token with role and tenantId', async () => {
      const token = await createToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify JWT token and return user data with role and tenantId', async () => {
      const token = await createToken(mockUser);
      const decoded = await verifyToken(token!);
      
      expect(decoded).toBeDefined();
      expect(decoded?.id).toBe(mockUser.id);
      expect(decoded?.role).toBe(mockUser.role);
      expect(decoded?.tenantId).toBe(mockUser.tenantId);
    });

    it('should handle seller role in JWT token', async () => {
      const sellerUser: Partial<User> = {
        id: 2,
        email: 'seller@example.com',
        role: 'SELLER',
        tenantId: 'tenant-456'
      };

      const token = await createToken(sellerUser);
      const decoded = await verifyToken(token!);
      
      expect(decoded?.role).toBe('SELLER');
      expect(decoded?.tenantId).toBe('tenant-456');
    });

    it('should handle user without tenantId (admin case)', async () => {
      const adminUser: Partial<User> = {
        id: 3,
        email: 'admin@example.com',
        role: 'ADMIN',
        tenantId: null
      };

      const token = await createToken(adminUser);
      const decoded = await verifyToken(token!);
      
      expect(decoded?.role).toBe('ADMIN');
      expect(decoded?.tenantId).toBeNull();
    });
  });

  describe('Password Hashing and Comparison', () => {
    const testPassword = 'testPassword123';

    it('should hash password correctly', async () => {
      const hashedPassword = await hashString(testPassword);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should compare password correctly', async () => {
      const hashedPassword = await hashString(testPassword);
      const isMatch = await compareString(testPassword, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hashedPassword = await hashString(testPassword);
      const isMatch = await compareString('wrongPassword', hashedPassword);
      expect(isMatch).toBe(false);
    });
  });
});