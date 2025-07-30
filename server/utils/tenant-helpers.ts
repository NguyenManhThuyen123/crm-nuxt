import type { User } from "@prisma/client";
import { createTenantServices, createTenantContext, type TenantContext } from "./tenant-db";
import { createInventoryTransactionService } from "./inventory-transactions";

/**
 * Helper utilities for working with tenant-aware services in API routes
 */

/**
 * Extracts user information from JWT token payload
 */
export function getUserFromToken(token: any): User | null {
  if (!token || !token.id || !token.role) {
    return null;
  }
  
  return {
    id: token.id,
    email: token.email,
    username: token.username,
    password: '', // Not needed for tenant context
    role: token.role,
    tenantId: token.tenantId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Creates tenant-aware services from a user object
 */
export function createUserTenantServices(user: User) {
  const context = createTenantContext(user);
  return {
    ...createTenantServices(context),
    inventory: createInventoryTransactionService(context),
    context,
  };
}

/**
 * Middleware helper to extract user and create tenant services
 * Usage in API routes:
 * 
 * export default defineEventHandler(async (event) => {
 *   const { user, services } = await requireTenantServices(event);
 *   // Use services.products, services.variants, etc.
 * });
 */
export async function requireTenantServices(event: any) {
  const token = await verifyToken(getCookie(event, 'token') || '');
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    });
  }

  const user = getUserFromToken(token);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid user token',
    });
  }

  const services = createUserTenantServices(user);

  return { user, services, context: services.context };
}

/**
 * Helper to require admin role
 */
export function requireAdmin(user: User) {
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required',
    });
  }
}

/**
 * Helper to require seller role with tenant assignment
 */
export function requireSellerWithTenant(user: User) {
  if (user.role !== 'SELLER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seller access required',
    });
  }
  
  if (!user.tenantId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seller must be assigned to a tenant',
    });
  }
}

/**
 * Helper to validate tenant access for the current user
 */
export function validateTenantAccess(user: User, requestedTenantId?: string) {
  if (user.role === 'ADMIN') {
    // Admins can access any tenant
    return;
  }
  
  if (user.role === 'SELLER') {
    if (!user.tenantId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Seller must be assigned to a tenant',
      });
    }
    
    if (requestedTenantId && requestedTenantId !== user.tenantId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied: Cannot access data from different tenant',
      });
    }
  }
}

/**
 * Helper to get effective tenant ID based on user role
 */
export function getEffectiveTenantId(user: User, requestedTenantId?: string): string | null {
  if (user.role === 'ADMIN') {
    return requestedTenantId || null;
  }
  
  return user.tenantId || null;
}

/**
 * Helper to create standardized error responses
 */
export function createTenantError(message: string, statusCode: number = 400) {
  return createError({
    statusCode,
    statusMessage: message,
  });
}

/**
 * Helper to handle database transaction errors
 */
export function handleTransactionError(error: any) {
  console.error('Transaction error:', error);
  
  if (error.message.includes('Insufficient stock')) {
    throw createTenantError(error.message, 422);
  }
  
  if (error.message.includes('not found')) {
    throw createTenantError(error.message, 404);
  }
  
  if (error.message.includes('Access denied')) {
    throw createTenantError(error.message, 403);
  }
  
  throw createTenantError('Internal server error', 500);
}

/**
 * Helper to validate pagination parameters
 */
export function validatePaginationParams(query: any) {
  const limit = query.limit ? parseInt(query.limit) : 50;
  const offset = query.offset ? parseInt(query.offset) : 0;
  
  if (limit < 1 || limit > 100) {
    throw createTenantError('Limit must be between 1 and 100');
  }
  
  if (offset < 0) {
    throw createTenantError('Offset must be non-negative');
  }
  
  return { limit, offset };
}

/**
 * Helper to validate date range parameters
 */
export function validateDateRange(query: any) {
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  
  if (query.startDate) {
    startDate = new Date(query.startDate);
    if (isNaN(startDate.getTime())) {
      throw createTenantError('Invalid start date format');
    }
  }
  
  if (query.endDate) {
    endDate = new Date(query.endDate);
    if (isNaN(endDate.getTime())) {
      throw createTenantError('Invalid end date format');
    }
  }
  
  if (startDate && endDate && startDate > endDate) {
    throw createTenantError('Start date must be before end date');
  }
  
  return { startDate, endDate };
}

/**
 * Helper to format API responses consistently
 */
export function formatApiResponse<T>(data: T, meta?: any) {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Helper to format error responses consistently
 */
export function formatErrorResponse(error: any) {
  return {
    error: {
      message: error.message || 'An error occurred',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
    },
  };
}

// Import required utilities (these should be available in the Nuxt server context)
// These imports are placed at the end to avoid circular dependencies
import { verifyToken } from './helpers';
import { getCookie, createError } from 'h3';