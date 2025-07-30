import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import {
  getUserFromToken,
  createUserTenantServices,
  requireAdmin,
  requireSellerWithTenant,
  validateTenantAccess,
  getEffectiveTenantId,
  validatePaginationParams,
  validateDateRange,
  formatApiResponse,
} from '../server/utils/tenant-helpers';

// Mock the dependencies
vi.mock('../server/utils/db', () => ({
  prisma: {
    product: { findMany: vi.fn() },
    productVariant: { findFirst: vi.fn() },
    invoice: { findMany: vi.fn() },
    tenant: { findMany: vi.fn() },
    $transaction: vi.fn(),
  }
}));

vi.mock('../server/utils/helpers', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('h3', () => ({
  getCookie: vi.fn(),
  createError: vi.fn((options) => new Error(options.statusMessage)),
}));

describe('Tenant Integration Helpers', () => {
  describe('getUserFromToken', () => {
    it('should extract user from valid token', () => {
      const token = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        role: 'ADMIN',
        tenantId: 'tenant-123',
      };

      const user = getUserFromToken(token);

      expect(user).toMatchObject({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        role: 'ADMIN',
        tenantId: 'tenant-123',
      });
    });

    it('should return null for invalid token', () => {
      expect(getUserFromToken(null)).toBeNull();
      expect(getUserFromToken({})).toBeNull();
      expect(getUserFromToken({ id: 1 })).toBeNull(); // missing role
    });
  });

  describe('createUserTenantServices', () => {
    it('should create services for admin user', () => {
      const user = {
        id: 1,
        email: 'admin@test.com',
        username: 'admin',
        password: 'hashed',
        role: UserRole.ADMIN,
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const services = createUserTenantServices(user);

      expect(services.products).toBeDefined();
      expect(services.variants).toBeDefined();
      expect(services.invoices).toBeDefined();
      expect(services.tenants).toBeDefined(); // Admin should have tenant management
      expect(services.inventory).toBeDefined();
      expect(services.context).toMatchObject({
        userId: 1,
        role: UserRole.ADMIN,
        tenantId: null,
      });
    });

    it('should create services for seller user', () => {
      const user = {
        id: 2,
        email: 'seller@test.com',
        username: 'seller',
        password: 'hashed',
        role: UserRole.SELLER,
        tenantId: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const services = createUserTenantServices(user);

      expect(services.products).toBeDefined();
      expect(services.variants).toBeDefined();
      expect(services.invoices).toBeDefined();
      expect(services.tenants).toBeNull(); // Seller should not have tenant management
      expect(services.inventory).toBeDefined();
      expect(services.context).toMatchObject({
        userId: 2,
        role: UserRole.SELLER,
        tenantId: 'tenant-123',
      });
    });
  });

  describe('Role Validation', () => {
    const adminUser = {
      id: 1,
      email: 'admin@test.com',
      username: 'admin',
      password: 'hashed',
      role: UserRole.ADMIN,
      tenantId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sellerUser = {
      id: 2,
      email: 'seller@test.com',
      username: 'seller',
      password: 'hashed',
      role: UserRole.SELLER,
      tenantId: 'tenant-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sellerWithoutTenant = {
      ...sellerUser,
      tenantId: null,
    };

    describe('requireAdmin', () => {
      it('should pass for admin user', () => {
        expect(() => requireAdmin(adminUser)).not.toThrow();
      });

      it('should throw for seller user', () => {
        expect(() => requireAdmin(sellerUser)).toThrow('Admin access required');
      });
    });

    describe('requireSellerWithTenant', () => {
      it('should pass for seller with tenant', () => {
        expect(() => requireSellerWithTenant(sellerUser)).not.toThrow();
      });

      it('should throw for admin user', () => {
        expect(() => requireSellerWithTenant(adminUser)).toThrow('Seller access required');
      });

      it('should throw for seller without tenant', () => {
        expect(() => requireSellerWithTenant(sellerWithoutTenant)).toThrow('Seller must be assigned to a tenant');
      });
    });

    describe('validateTenantAccess', () => {
      it('should allow admin to access any tenant', () => {
        expect(() => validateTenantAccess(adminUser, 'any-tenant')).not.toThrow();
        expect(() => validateTenantAccess(adminUser)).not.toThrow();
      });

      it('should allow seller to access their own tenant', () => {
        expect(() => validateTenantAccess(sellerUser, 'tenant-123')).not.toThrow();
        expect(() => validateTenantAccess(sellerUser)).not.toThrow();
      });

      it('should prevent seller from accessing different tenant', () => {
        expect(() => validateTenantAccess(sellerUser, 'tenant-456')).toThrow('Access denied: Cannot access data from different tenant');
      });

      it('should throw for seller without tenant', () => {
        expect(() => validateTenantAccess(sellerWithoutTenant)).toThrow('Seller must be assigned to a tenant');
      });
    });

    describe('getEffectiveTenantId', () => {
      it('should return requested tenant for admin', () => {
        expect(getEffectiveTenantId(adminUser, 'tenant-456')).toBe('tenant-456');
        expect(getEffectiveTenantId(adminUser)).toBeNull();
      });

      it('should return seller tenant regardless of request', () => {
        expect(getEffectiveTenantId(sellerUser, 'tenant-456')).toBe('tenant-123');
        expect(getEffectiveTenantId(sellerUser)).toBe('tenant-123');
      });
    });
  });

  describe('Validation Helpers', () => {
    describe('validatePaginationParams', () => {
      it('should return default values for empty query', () => {
        const result = validatePaginationParams({});
        expect(result).toEqual({ limit: 50, offset: 0 });
      });

      it('should parse valid pagination params', () => {
        const result = validatePaginationParams({ limit: '20', offset: '10' });
        expect(result).toEqual({ limit: 20, offset: 10 });
      });

      it('should throw for invalid limit', () => {
        expect(() => validatePaginationParams({ limit: '0' })).toThrow('Limit must be between 1 and 100');
        expect(() => validatePaginationParams({ limit: '101' })).toThrow('Limit must be between 1 and 100');
      });

      it('should throw for negative offset', () => {
        expect(() => validatePaginationParams({ offset: '-1' })).toThrow('Offset must be non-negative');
      });
    });

    describe('validateDateRange', () => {
      it('should return undefined for empty query', () => {
        const result = validateDateRange({});
        expect(result).toEqual({ startDate: undefined, endDate: undefined });
      });

      it('should parse valid dates', () => {
        const result = validateDateRange({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
        
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
      });

      it('should throw for invalid date format', () => {
        expect(() => validateDateRange({ startDate: 'invalid-date' })).toThrow('Invalid start date format');
        expect(() => validateDateRange({ endDate: 'invalid-date' })).toThrow('Invalid end date format');
      });

      it('should throw when start date is after end date', () => {
        expect(() => validateDateRange({
          startDate: '2024-01-31',
          endDate: '2024-01-01',
        })).toThrow('Start date must be before end date');
      });
    });
  });

  describe('Response Formatting', () => {
    describe('formatApiResponse', () => {
      it('should format response with data and timestamp', () => {
        const data = { id: 1, name: 'Test' };
        const response = formatApiResponse(data);

        expect(response.data).toEqual(data);
        expect(response.meta.timestamp).toBeDefined();
        expect(new Date(response.meta.timestamp)).toBeInstanceOf(Date);
      });

      it('should include additional meta information', () => {
        const data = { id: 1, name: 'Test' };
        const meta = { total: 100, page: 1 };
        const response = formatApiResponse(data, meta);

        expect(response.data).toEqual(data);
        expect(response.meta.total).toBe(100);
        expect(response.meta.page).toBe(1);
        expect(response.meta.timestamp).toBeDefined();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete admin workflow', () => {
      const adminUser = {
        id: 1,
        email: 'admin@test.com',
        username: 'admin',
        password: 'hashed',
        role: UserRole.ADMIN,
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Admin should pass all validations
      expect(() => requireAdmin(adminUser)).not.toThrow();
      expect(() => validateTenantAccess(adminUser, 'any-tenant')).not.toThrow();

      // Admin should get all services
      const services = createUserTenantServices(adminUser);
      expect(services.tenants).toBeDefined();

      // Admin should be able to access any tenant
      expect(getEffectiveTenantId(adminUser, 'tenant-123')).toBe('tenant-123');
    });

    it('should handle complete seller workflow', () => {
      const sellerUser = {
        id: 2,
        email: 'seller@test.com',
        username: 'seller',
        password: 'hashed',
        role: UserRole.SELLER,
        tenantId: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Seller should pass seller validations
      expect(() => requireSellerWithTenant(sellerUser)).not.toThrow();
      expect(() => validateTenantAccess(sellerUser, 'tenant-123')).not.toThrow();

      // Seller should get limited services
      const services = createUserTenantServices(sellerUser);
      expect(services.tenants).toBeNull();

      // Seller should be restricted to their tenant
      expect(getEffectiveTenantId(sellerUser, 'tenant-456')).toBe('tenant-123');
    });

    it('should handle data isolation between tenants', () => {
      const seller1 = {
        id: 2,
        email: 'seller1@test.com',
        username: 'seller1',
        password: 'hashed',
        role: UserRole.SELLER,
        tenantId: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const seller2 = {
        id: 3,
        email: 'seller2@test.com',
        username: 'seller2',
        password: 'hashed',
        role: UserRole.SELLER,
        tenantId: 'tenant-456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Each seller should only access their own tenant
      expect(getEffectiveTenantId(seller1)).toBe('tenant-123');
      expect(getEffectiveTenantId(seller2)).toBe('tenant-456');

      // Cross-tenant access should be denied
      expect(() => validateTenantAccess(seller1, 'tenant-456')).toThrow();
      expect(() => validateTenantAccess(seller2, 'tenant-123')).toThrow();
    });
  });
});