import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User, Tenant } from '@prisma/client';

// Mock $fetch
const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

// Mock useState
const mockUserState = { value: undefined };
vi.mock('#app', () => ({
  useState: vi.fn(() => mockUserState),
  useRequestHeaders: vi.fn(() => ({}))
}));

// Mock the composable
const mockUseAuth = () => {
  const isAdmin = () => mockUserState.value?.role === 'ADMIN';
  const isSeller = () => mockUserState.value?.role === 'SELLER';
  const getTenantId = () => mockUserState.value?.tenantId || null;
  const getRoleBasedRedirect = () => {
    if (isAdmin()) return '/admin';
    if (isSeller()) return '/seller';
    return '/admin/contacts';
  };
  
  const login = async (data: { email: string; password: string }) => {
    try {
      const res = await mockFetch('/api/auth/login', {
        method: 'POST',
        body: data,
      });
      mockUserState.value = res;
      return res;
    } catch (error: any) {
      throw error.data;
    }
  };

  return { isAdmin, isSeller, getTenantId, getRoleBasedRedirect, login };
};

describe('Auth Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserState.value = undefined;
  });

  describe('Role-based helper functions', () => {
    it('should correctly identify admin user', () => {
      const adminUser: User & { tenant?: Tenant | null } = {
        id: 1,
        email: 'admin@example.com',
        password: 'hashed',
        username: null,
        role: 'ADMIN',
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: null
      };

      mockUserState.value = adminUser;
      const { isAdmin, isSeller } = mockUseAuth();

      expect(isAdmin()).toBe(true);
      expect(isSeller()).toBe(false);
    });

    it('should correctly identify seller user', () => {
      const sellerUser: User & { tenant?: Tenant | null } = {
        id: 2,
        email: 'seller@example.com',
        password: 'hashed',
        username: null,
        role: 'SELLER',
        tenantId: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: {
          id: 'tenant-123',
          name: 'Test Store',
          address: '123 Main St',
          contact: 'contact@store.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockUserState.value = sellerUser;
      const { isAdmin, isSeller } = mockUseAuth();

      expect(isAdmin()).toBe(false);
      expect(isSeller()).toBe(true);
    });

    it('should return correct tenant ID', () => {
      const sellerUser: User & { tenant?: Tenant | null } = {
        id: 2,
        email: 'seller@example.com',
        password: 'hashed',
        username: null,
        role: 'SELLER',
        tenantId: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: null
      };

      mockUserState.value = sellerUser;
      const { getTenantId } = mockUseAuth();

      expect(getTenantId()).toBe('tenant-123');
    });

    it('should return null tenant ID for admin', () => {
      const adminUser: User & { tenant?: Tenant | null } = {
        id: 1,
        email: 'admin@example.com',
        password: 'hashed',
        username: null,
        role: 'ADMIN',
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: null
      };

      mockUserState.value = adminUser;
      const { getTenantId } = mockUseAuth();

      expect(getTenantId()).toBeNull();
    });

    it('should return correct role-based redirect for admin', () => {
      const adminUser: User & { tenant?: Tenant | null } = {
        id: 1,
        email: 'admin@example.com',
        password: 'hashed',
        username: null,
        role: 'ADMIN',
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: null
      };

      mockUserState.value = adminUser;
      const { getRoleBasedRedirect } = mockUseAuth();

      expect(getRoleBasedRedirect()).toBe('/admin');
    });

    it('should return correct role-based redirect for seller', () => {
      const sellerUser: User & { tenant?: Tenant | null } = {
        id: 2,
        email: 'seller@example.com',
        password: 'hashed',
        username: null,
        role: 'SELLER',
        tenantId: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: null
      };

      mockUserState.value = sellerUser;
      const { getRoleBasedRedirect } = mockUseAuth();

      expect(getRoleBasedRedirect()).toBe('/seller');
    });

    it('should return fallback redirect for undefined user', () => {
      mockUserState.value = undefined;
      const { getRoleBasedRedirect } = mockUseAuth();

      expect(getRoleBasedRedirect()).toBe('/admin/contacts');
    });
  });

  describe('Authentication methods', () => {
    it('should login user and set user state', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'ADMIN',
        tenantId: null,
        tenant: null
      };

      mockFetch.mockResolvedValueOnce(mockUser);

      const { login } = mockUseAuth();
      const result = await login({ email: 'test@example.com', password: 'password' });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' }
      });
      expect(mockUserState.value).toBe(mockUser);
      expect(result).toBe(mockUser);
    });

    it('should handle login error', async () => {
      const mockError = { data: { message: 'Invalid credentials' } };
      mockFetch.mockRejectedValueOnce(mockError);

      const { login } = mockUseAuth();

      await expect(login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toEqual({ message: 'Invalid credentials' });
    });
  });
});