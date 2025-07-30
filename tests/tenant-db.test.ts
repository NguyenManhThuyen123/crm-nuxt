import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient, UserRole } from '@prisma/client';

// Mock the db import
vi.mock('../server/utils/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    invoiceItem: {
      create: vi.fn(),
    },
    tenant: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}));

import {
  TenantProductService,
  TenantVariantService,
  TenantInvoiceService,
  TenantManagementService,
  createTenantServices,
  createTenantContext,
  type TenantContext
} from '../server/utils/tenant-db';

describe('Tenant-Aware Database Services', () => {
  let adminContext: TenantContext;
  let sellerContext: TenantContext;
  let sellerWithoutTenantContext: TenantContext;

  let mockPrisma: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get the mocked prisma instance
    const { prisma } = await import('../server/utils/db');
    mockPrisma = prisma;

    // Setup test contexts
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

    sellerWithoutTenantContext = {
      userId: 3,
      role: UserRole.SELLER,
      tenantId: null,
    };
  });

  describe('TenantProductService', () => {
    describe('Tenant Isolation', () => {
      it('should allow admin to access products from any tenant', async () => {
        const service = new TenantProductService(adminContext);
        const mockProducts = [
          { id: 1, name: 'Product 1', tenantId: 'tenant-123' },
          { id: 2, name: 'Product 2', tenantId: 'tenant-456' },
        ];

        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        const result = await service.getProducts({ tenantId: 'tenant-123' });

        expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-123' },
          include: { variants: true, tenant: true },
          take: undefined,
          skip: undefined,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should restrict seller to their assigned tenant only', async () => {
        const service = new TenantProductService(sellerContext);
        const mockProducts = [
          { id: 1, name: 'Product 1', tenantId: 'tenant-123' },
        ];

        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        const result = await service.getProducts();

        expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-123' },
          include: { variants: true, tenant: true },
          take: undefined,
          skip: undefined,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should throw error when seller tries to access different tenant', async () => {
        const service = new TenantProductService(sellerContext);

        await expect(
          service.getProducts({ tenantId: 'tenant-456' })
        ).rejects.toThrow('Access denied: Cannot access data from different tenant');
      });

      it('should throw error when seller has no assigned tenant', async () => {
        const service = new TenantProductService(sellerWithoutTenantContext);

        await expect(
          service.getProducts()
        ).rejects.toThrow('Seller must be assigned to a tenant');
      });
    });

    describe('Product CRUD Operations', () => {
      it('should create product with proper tenant assignment for seller', async () => {
        const service = new TenantProductService(sellerContext);
        const productData = {
          name: 'New Product',
          description: 'Test product',
          category: 'Electronics',
          tenantId: 'tenant-123',
        };

        const mockProduct = { id: 1, ...productData };
        mockPrisma.product.create.mockResolvedValue(mockProduct);

        const result = await service.createProduct(productData);

        expect(mockPrisma.product.create).toHaveBeenCalledWith({
          data: {
            ...productData,
            tenantId: 'tenant-123',
          },
          include: { variants: true, tenant: true },
        });
      });

      it('should validate product access before update', async () => {
        const service = new TenantProductService(sellerContext);
        const mockProduct = { id: 1, name: 'Product 1', tenantId: 'tenant-123' };

        mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
        mockPrisma.product.update.mockResolvedValue(mockProduct);

        await service.updateProduct(1, { name: 'Updated Product' });

        expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
          where: { id: 1, tenantId: 'tenant-123' },
          include: { variants: true, tenant: true },
        });
      });

      it('should throw error when updating non-existent product', async () => {
        const service = new TenantProductService(sellerContext);

        mockPrisma.product.findFirst.mockResolvedValue(null);

        await expect(
          service.updateProduct(999, { name: 'Updated Product' })
        ).rejects.toThrow('Product not found or access denied');
      });
    });
  });

  describe('TenantVariantService', () => {
    describe('Barcode Lookup with Tenant Filtering', () => {
      it('should find variant by barcode within seller tenant', async () => {
        const service = new TenantVariantService(sellerContext);
        const mockVariant = {
          id: 1,
          barcode: '123456789',
          tenantId: 'tenant-123',
          product: { name: 'Product 1', tenant: { name: 'Store 1' } },
        };

        mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);

        const result = await service.getVariantByBarcode('123456789');

        expect(mockPrisma.productVariant.findFirst).toHaveBeenCalledWith({
          where: { barcode: '123456789', tenantId: 'tenant-123' },
          include: { product: { include: { tenant: true } } },
        });
        expect(result).toEqual(mockVariant);
      });

      it('should throw error when barcode not found in tenant', async () => {
        const service = new TenantVariantService(sellerContext);

        mockPrisma.productVariant.findFirst.mockResolvedValue(null);

        await expect(
          service.getVariantByBarcode('999999999')
        ).rejects.toThrow('Product variant not found or access denied');
      });

      it('should allow admin to search across all tenants', async () => {
        const service = new TenantVariantService(adminContext);
        const mockVariant = {
          id: 1,
          barcode: '123456789',
          tenantId: 'tenant-456',
          product: { name: 'Product 1', tenant: { name: 'Store 2' } },
        };

        mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);

        const result = await service.getVariantByBarcode('123456789', 'tenant-456');

        expect(mockPrisma.productVariant.findFirst).toHaveBeenCalledWith({
          where: { barcode: '123456789', tenantId: 'tenant-456' },
          include: { product: { include: { tenant: true } } },
        });
      });
    });

    describe('Stock Management', () => {
      it('should update stock within tenant boundaries', async () => {
        const service = new TenantVariantService(sellerContext);
        const mockVariant = { id: 1, stock: 10, tenantId: 'tenant-123' };

        mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);
        mockPrisma.productVariant.update.mockResolvedValue({ ...mockVariant, stock: 15 });

        const result = await service.updateVariantStock(1, 5);

        expect(mockPrisma.productVariant.findFirst).toHaveBeenCalledWith({
          where: { id: 1, tenantId: 'tenant-123' },
        });
        expect(mockPrisma.productVariant.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { stock: 15 },
          include: { product: true },
        });
      });

      it('should prevent negative stock', async () => {
        const service = new TenantVariantService(sellerContext);
        const mockVariant = { id: 1, stock: 5, tenantId: 'tenant-123' };

        mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);

        await expect(
          service.updateVariantStock(1, -10)
        ).rejects.toThrow('Insufficient stock');
      });
    });
  });

  describe('TenantInvoiceService', () => {
    describe('Invoice Access Control', () => {
      it('should restrict seller to their own invoices', async () => {
        const service = new TenantInvoiceService(sellerContext);
        const mockInvoices = [
          { id: 1, userId: 2, tenantId: 'tenant-123' },
        ];

        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

        await service.getInvoices();

        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-123', userId: 2 },
          include: expect.any(Object),
          take: undefined,
          skip: undefined,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should allow admin to view all invoices', async () => {
        const service = new TenantInvoiceService(adminContext);
        const mockInvoices = [
          { id: 1, userId: 2, tenantId: 'tenant-123' },
          { id: 2, userId: 3, tenantId: 'tenant-456' },
        ];

        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

        await service.getInvoices({ tenantId: 'tenant-123' });

        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-123' },
          include: expect.any(Object),
          take: undefined,
          skip: undefined,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should prevent seller from accessing other users invoices', async () => {
        const service = new TenantInvoiceService(sellerContext);

        mockPrisma.invoice.findFirst.mockResolvedValue(null);

        await expect(
          service.getInvoiceById(999)
        ).rejects.toThrow('Invoice not found or access denied');
      });
    });

    describe('Invoice Creation with Stock Validation', () => {
      it('should create invoice with proper transaction handling', async () => {
        const service = new TenantInvoiceService(sellerContext);
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
              update: vi.fn(),
            },
            invoice: {
              create: vi.fn().mockResolvedValue({ id: 1, totalAmount: 35.00 }),
              findUnique: vi.fn().mockResolvedValue({
                id: 1,
                totalAmount: 35.00,
                items: invoiceData.items,
              }),
            },
            invoiceItem: {
              create: vi.fn(),
            },
          };
          return callback(mockTx);
        });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.createInvoice(invoiceData);

        expect(mockTransaction).toHaveBeenCalled();
      });

      it('should reject invoice when insufficient stock', async () => {
        const service = new TenantInvoiceService(sellerContext);
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
          service.createInvoice(invoiceData)
        ).rejects.toThrow('Insufficient stock for variant 1');
      });
    });
  });

  describe('TenantManagementService', () => {
    describe('Admin-Only Access', () => {
      it('should allow admin to create tenant management service', () => {
        expect(() => new TenantManagementService(adminContext)).not.toThrow();
      });

      it('should prevent seller from creating tenant management service', () => {
        expect(() => new TenantManagementService(sellerContext))
          .toThrow('Tenant management requires admin privileges');
      });

      it('should allow admin to manage tenants', async () => {
        const service = new TenantManagementService(adminContext);
        const mockTenants = [
          { id: 'tenant-123', name: 'Store 1' },
          { id: 'tenant-456', name: 'Store 2' },
        ];

        mockPrisma.tenant.findMany.mockResolvedValue(mockTenants);

        const result = await service.getTenants();

        expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith({
          include: {
            users: { select: { id: true, email: true, username: true, role: true } },
            _count: { select: { products: true, invoices: true } },
          },
          take: undefined,
          skip: undefined,
          orderBy: { createdAt: 'desc' },
        });
      });
    });
  });

  describe('Factory Functions', () => {
    describe('createTenantServices', () => {
      it('should create services for admin with tenant management', () => {
        const services = createTenantServices(adminContext);

        expect(services.products).toBeInstanceOf(TenantProductService);
        expect(services.variants).toBeInstanceOf(TenantVariantService);
        expect(services.invoices).toBeInstanceOf(TenantInvoiceService);
        expect(services.tenants).toBeInstanceOf(TenantManagementService);
      });

      it('should create services for seller without tenant management', () => {
        const services = createTenantServices(sellerContext);

        expect(services.products).toBeInstanceOf(TenantProductService);
        expect(services.variants).toBeInstanceOf(TenantVariantService);
        expect(services.invoices).toBeInstanceOf(TenantInvoiceService);
        expect(services.tenants).toBeNull();
      });
    });

    describe('createTenantContext', () => {
      it('should create context from user object', () => {
        const user = {
          id: 1,
          role: UserRole.ADMIN,
          tenantId: 'tenant-123',
        };

        const context = createTenantContext(user);

        expect(context).toEqual({
          userId: 1,
          role: UserRole.ADMIN,
          tenantId: 'tenant-123',
        });
      });

      it('should handle null tenantId', () => {
        const user = {
          id: 1,
          role: UserRole.ADMIN,
          tenantId: null,
        };

        const context = createTenantContext(user);

        expect(context.tenantId).toBeNull();
      });
    });
  });

  describe('Data Isolation Validation', () => {
    it('should ensure complete data isolation between tenants', async () => {
      const seller1Context = { userId: 2, role: UserRole.SELLER, tenantId: 'tenant-123' };
      const seller2Context = { userId: 3, role: UserRole.SELLER, tenantId: 'tenant-456' };

      const service1 = new TenantProductService(seller1Context);
      const service2 = new TenantProductService(seller2Context);

      // Mock different products for different tenants
      mockPrisma.product.findMany
        .mockResolvedValueOnce([{ id: 1, name: 'Product 1', tenantId: 'tenant-123' }])
        .mockResolvedValueOnce([{ id: 2, name: 'Product 2', tenantId: 'tenant-456' }]);

      const result1 = await service1.getProducts();
      const result2 = await service2.getProducts();

      // Verify each service only gets data from their respective tenant
      expect(mockPrisma.product.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: { tenantId: 'tenant-123' },
      }));
      expect(mockPrisma.product.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
        where: { tenantId: 'tenant-456' },
      }));
    });

    it('should prevent cross-tenant data access attempts', async () => {
      const service = new TenantProductService(sellerContext);

      // Attempt to access product from different tenant should fail
      await expect(
        service.getProducts({ tenantId: 'tenant-456' })
      ).rejects.toThrow('Access denied: Cannot access data from different tenant');

      // Verify no database call was made
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });
  });
});