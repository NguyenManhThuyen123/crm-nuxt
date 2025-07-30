import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock the db import
vi.mock('../server/utils/db', () => ({
  prisma: {
    productVariant: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    invoiceItem: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}));

import {
  InventoryTransactionService,
  createInventoryTransactionService,
  type StockMovement,
  type BulkStockUpdate,
} from '../server/utils/inventory-transactions';
import type { TenantContext } from '../server/utils/tenant-db';

describe('Inventory Transaction Service', () => {
  let adminContext: TenantContext;
  let sellerContext: TenantContext;
  let service: InventoryTransactionService;
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked prisma instance
    const { prisma } = await import('../server/utils/db');
    mockPrisma = prisma;

    adminContext = {
      userId: 1,
      role: UserRole.ADMIN,
      tenantId: null,
    };

    sellerContext = {
      userId: 2,
      role: UserRole.SELLER,
      tenantId: 'tenant-123',
    };

    service = new InventoryTransactionService(sellerContext);
  });

  describe('Stock Movements', () => {
    describe('performStockMovements', () => {
      it('should perform atomic stock movements successfully', async () => {
        const movements: StockMovement[] = [
          { variantId: 1, quantity: 5, type: 'IN', reason: 'Restock' },
          { variantId: 2, quantity: 2, type: 'OUT', reason: 'Sale' },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 10, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 2, stock: 5, tenantId: 'tenant-123' }),
              update: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 15 })
                .mockResolvedValueOnce({ id: 2, stock: 3 }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.performStockMovements(movements);

        expect(result.success).toBe(true);
        expect(result.affectedVariants).toEqual([1, 2]);
        expect(result.errors).toBeUndefined();
      });

      it('should validate tenant access for stock movements', async () => {
        const movements: StockMovement[] = [
          { variantId: 1, quantity: 5, type: 'IN', reason: 'Restock' },
        ];

        await expect(
          service.performStockMovements(movements, 'tenant-456')
        ).rejects.toThrow('Access denied: Cannot access inventory from different tenant');
      });

      it('should prevent stock movements when insufficient stock for OUT operations', async () => {
        const movements: StockMovement[] = [
          { variantId: 1, quantity: 10, type: 'OUT', reason: 'Sale' },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn().mockResolvedValue({ id: 1, stock: 5, tenantId: 'tenant-123' }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.performStockMovements(movements);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Validation failed: Insufficient stock for variant 1. Available: 5, Requested: 10');
      });

      it('should rollback transaction on validation errors', async () => {
        const movements: StockMovement[] = [
          { variantId: 999, quantity: 5, type: 'IN', reason: 'Restock' },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn().mockResolvedValue(null),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.performStockMovements(movements);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Validation failed: Variant 999 not found or access denied');
      });

      it('should handle mixed IN and OUT movements correctly', async () => {
        const movements: StockMovement[] = [
          { variantId: 1, quantity: 10, type: 'IN', reason: 'Restock' },
          { variantId: 1, quantity: 3, type: 'OUT', reason: 'Sale' },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 5, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 1, stock: 5, tenantId: 'tenant-123' }),
              update: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 15 }) // +10
                .mockResolvedValueOnce({ id: 1, stock: 12 }), // -3
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.performStockMovements(movements);

        expect(result.success).toBe(true);
        expect(result.affectedVariants).toEqual([1, 1]);
      });
    });

    describe('performBulkStockUpdate', () => {
      it('should perform bulk stock updates successfully', async () => {
        const updates: BulkStockUpdate[] = [
          { variantId: 1, newStock: 20 },
          { variantId: 2, newStock: 15 },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 2, tenantId: 'tenant-123' }),
              update: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 20 })
                .mockResolvedValueOnce({ id: 2, stock: 15 }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.performBulkStockUpdate(updates);

        expect(result.success).toBe(true);
        expect(result.affectedVariants).toEqual([1, 2]);
      });

      it('should reject negative stock values', async () => {
        const updates: BulkStockUpdate[] = [
          { variantId: 1, newStock: -5 },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          return callback({});
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.performBulkStockUpdate(updates);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Validation failed: Invalid stock value for variant 1: -5');
      });

      it('should validate variant existence and tenant access', async () => {
        const updates: BulkStockUpdate[] = [
          { variantId: 999, newStock: 10 },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn().mockResolvedValue(null),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.performBulkStockUpdate(updates);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Validation failed: Variant 999 not found or access denied');
      });
    });
  });

  describe('Invoice Creation with Stock Reduction', () => {
    describe('createInvoiceWithStockReduction', () => {
      it('should create invoice and reduce stock atomically', async () => {
        const invoiceData = {
          items: [
            { variantId: 1, quantity: 2, unitPrice: 10.00 },
            { variantId: 2, quantity: 1, unitPrice: 15.00 },
          ],
          tenantId: 'tenant-123',
        };

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 10, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 2, stock: 5, tenantId: 'tenant-123' }),
              update: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 8 })
                .mockResolvedValueOnce({ id: 2, stock: 4 }),
            },
            invoice: {
              create: vi.fn().mockResolvedValue({ id: 1, totalAmount: 35.00 }),
              findUnique: vi.fn().mockResolvedValue({
                id: 1,
                totalAmount: 35.00,
                items: invoiceData.items,
                user: { id: 2, email: 'seller@test.com' },
                tenant: { id: 'tenant-123', name: 'Test Store' },
              }),
            },
            invoiceItem: {
              create: vi.fn()
                .mockResolvedValueOnce({ id: 1 })
                .mockResolvedValueOnce({ id: 2 }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.createInvoiceWithStockReduction(invoiceData);

        expect(result).toBeDefined();
        expect(result.totalAmount).toBe(35.00);
      });

      it('should reject invoice when variant not found', async () => {
        const invoiceData = {
          items: [{ variantId: 999, quantity: 1, unitPrice: 10.00 }],
          tenantId: 'tenant-123',
        };

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn().mockResolvedValue(null),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        await expect(
          service.createInvoiceWithStockReduction(invoiceData)
        ).rejects.toThrow('Product variant 999 not found');
      });

      it('should reject invoice when insufficient stock', async () => {
        const invoiceData = {
          items: [{ variantId: 1, quantity: 20, unitPrice: 10.00 }],
          tenantId: 'tenant-123',
        };

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn().mockResolvedValue({ id: 1, stock: 5, tenantId: 'tenant-123' }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        await expect(
          service.createInvoiceWithStockReduction(invoiceData)
        ).rejects.toThrow('Insufficient stock for variant 1. Available: 5, Requested: 20');
      });

      it('should calculate total amount correctly', async () => {
        const invoiceData = {
          items: [
            { variantId: 1, quantity: 3, unitPrice: 12.50 },
            { variantId: 2, quantity: 2, unitPrice: 8.75 },
          ],
          tenantId: 'tenant-123',
        };

        const expectedTotal = (3 * 12.50) + (2 * 8.75); // 37.50 + 17.50 = 55.00

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 10, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 2, stock: 5, tenantId: 'tenant-123' }),
              update: vi.fn(),
            },
            invoice: {
              create: vi.fn().mockImplementation((data) => {
                expect(data.data.totalAmount).toBe(expectedTotal);
                return Promise.resolve({ id: 1, totalAmount: expectedTotal });
              }),
              findUnique: vi.fn().mockResolvedValue({
                id: 1,
                totalAmount: expectedTotal,
              }),
            },
            invoiceItem: {
              create: vi.fn(),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        await service.createInvoiceWithStockReduction(invoiceData);
      });
    });
  });

  describe('Stock Transfer Operations', () => {
    describe('transferStockBetweenVariants', () => {
      it('should transfer stock between variants atomically', async () => {
        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 10, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 2, stock: 5, tenantId: 'tenant-123' }),
              update: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 7 })  // -3
                .mockResolvedValueOnce({ id: 2, stock: 8 }), // +3
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.transferStockBetweenVariants(1, 2, 3);

        expect(result.success).toBe(true);
        expect(result.affectedVariants).toEqual([1, 2]);
      });

      it('should reject transfer when insufficient stock in source', async () => {
        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 2, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 2, stock: 5, tenantId: 'tenant-123' }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.transferStockBetweenVariants(1, 2, 5);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Insufficient stock in source variant 1. Available: 2, Requested: 5');
      });

      it('should reject transfer when variants not found', async () => {
        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 2, stock: 5, tenantId: 'tenant-123' }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.transferStockBetweenVariants(999, 2, 3);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Source variant 999 not found or access denied');
      });
    });
  });

  describe('Stock Monitoring', () => {
    describe('getLowStockVariants', () => {
      it('should return variants with stock below threshold', async () => {
        const mockVariants = [
          { id: 1, stock: 2, product: { name: 'Product 1', tenant: { name: 'Store 1' } } },
          { id: 2, stock: 5, product: { name: 'Product 2', tenant: { name: 'Store 1' } } },
        ];

        mockPrisma.productVariant.findMany.mockResolvedValue(mockVariants);

        const result = await service.getLowStockVariants(10);

        expect(mockPrisma.productVariant.findMany).toHaveBeenCalledWith({
          where: {
            stock: { lte: 10 },
            tenantId: 'tenant-123',
          },
          include: {
            product: { include: { tenant: true } },
          },
          orderBy: { stock: 'asc' },
        });
        expect(result).toEqual(mockVariants);
      });

      it('should respect tenant filtering for sellers', async () => {
        mockPrisma.productVariant.findMany.mockResolvedValue([]);

        await service.getLowStockVariants(5);

        expect(mockPrisma.productVariant.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              tenantId: 'tenant-123',
            }),
          })
        );
      });

      it('should allow admin to check across all tenants', async () => {
        const adminService = new InventoryTransactionService(adminContext);
        mockPrisma.productVariant.findMany.mockResolvedValue([]);

        await adminService.getLowStockVariants(5);

        expect(mockPrisma.productVariant.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              stock: { lte: 5 },
            }),
          })
        );
        
        // Should not include tenantId filter for admin
        const call = mockPrisma.productVariant.findMany.mock.calls[0][0];
        expect(call.where).not.toHaveProperty('tenantId');
      });
    });

    describe('getStockMovementHistory', () => {
      it('should return stock movement history for tenant', async () => {
        const mockHistory = [
          {
            id: 1,
            quantity: 2,
            variant: { id: 1, product: { name: 'Product 1' } },
            invoice: { user: { email: 'seller@test.com' } },
          },
        ];

        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockHistory);

        const result = await service.getStockMovementHistory();

        expect(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith({
          where: {
            variant: { tenantId: 'tenant-123' },
          },
          include: expect.any(Object),
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        expect(result).toEqual(mockHistory);
      });

      it('should filter by specific variant when provided', async () => {
        mockPrisma.invoiceItem.findMany.mockResolvedValue([]);

        await service.getStockMovementHistory(1);

        expect(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              variantId: 1,
            }),
          })
        );
      });
    });
  });

  describe('Stock Reservation (Future Enhancement)', () => {
    describe('reserveStock', () => {
      it('should validate stock availability for reservations', async () => {
        const reservations = [
          { variantId: 1, quantity: 3, reservationId: 'res-123' },
          { variantId: 2, quantity: 2, reservationId: 'res-124' },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn()
                .mockResolvedValueOnce({ id: 1, stock: 10, tenantId: 'tenant-123' })
                .mockResolvedValueOnce({ id: 2, stock: 5, tenantId: 'tenant-123' }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.reserveStock(reservations);

        expect(result.success).toBe(true);
        expect(result.affectedVariants).toEqual([1, 2]);
      });

      it('should reject reservations when insufficient stock', async () => {
        const reservations = [
          { variantId: 1, quantity: 15, reservationId: 'res-123' },
        ];

        const mockTransaction = vi.fn().mockImplementation(async (callback) => {
          const mockTx = {
            productVariant: {
              findFirst: vi.fn().mockResolvedValue({ id: 1, stock: 10, tenantId: 'tenant-123' }),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.reserveStock(reservations);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Reservation validation failed: Insufficient stock for reservation of variant 1. Available: 10, Requested: 15');
      });
    });
  });

  describe('Factory Function', () => {
    describe('createInventoryTransactionService', () => {
      it('should create service with proper context', () => {
        const service = createInventoryTransactionService(sellerContext);
        expect(service).toBeInstanceOf(InventoryTransactionService);
      });
    });
  });

  describe('Tenant Access Validation', () => {
    it('should prevent seller from accessing different tenant inventory', async () => {
      await expect(
        service.performStockMovements([], 'tenant-456')
      ).rejects.toThrow('Access denied: Cannot access inventory from different tenant');
    });

    it('should allow admin to access any tenant inventory', async () => {
      const adminService = new InventoryTransactionService(adminContext);
      
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return callback({
          productVariant: { findFirst: vi.fn(), update: vi.fn() },
        });
      });

      mockPrisma.$transaction = mockTransaction;

      // Should not throw for admin accessing different tenant
      await expect(
        adminService.performStockMovements([], 'tenant-456')
      ).resolves.toBeDefined();
    });
  });
});