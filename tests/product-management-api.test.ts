import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashString } from '~/server/utils/helpers';

const prisma = new PrismaClient();

// Test data setup
const testTenant = {
  id: 'test-tenant-id',
  name: 'Test Store',
  address: '123 Test St',
  contact: 'test@example.com',
};

const adminUser = {
  email: 'admin@test.com',
  password: 'password123',
  username: 'admin',
  role: 'ADMIN' as const,
  tenantId: null,
};

const sellerUser = {
  email: 'seller@test.com',
  password: 'password123',
  username: 'seller',
  role: 'SELLER' as const,
  tenantId: testTenant.id,
};

const testProduct = {
  name: 'Test Product',
  description: 'A test product',
  category: 'Electronics',
  tenantId: testTenant.id,
};

const testVariant = {
  barcode: 'TEST123456789',
  weight: 1.5,
  price: 29.99,
  stock: 100,
  tenantId: testTenant.id,
};

describe('Product Management API Integration Tests', () => {
  let createdTenant: any;
  let createdAdminUser: any;
  let createdSellerUser: any;
  let createdProduct: any;
  let createdVariant: any;

  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: [adminUser.email, sellerUser.email] } }
    });
    await prisma.tenant.deleteMany({
      where: { id: testTenant.id }
    });

    // Create test tenant
    createdTenant = await prisma.tenant.create({
      data: testTenant,
    });

    // Create test users
    createdAdminUser = await prisma.user.create({
      data: {
        ...adminUser,
        password: await hashString(adminUser.password),
      },
    });

    createdSellerUser = await prisma.user.create({
      data: {
        ...sellerUser,
        password: await hashString(sellerUser.password),
      },
    });

    // Create test product
    createdProduct = await prisma.product.create({
      data: testProduct,
    });

    // Create test variant
    createdVariant = await prisma.productVariant.create({
      data: {
        ...testVariant,
        productId: createdProduct.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: [adminUser.email, sellerUser.email] } }
    });
    await prisma.tenant.deleteMany({
      where: { id: testTenant.id }
    });
  });

  describe('Admin Product CRUD Operations', () => {
    it('should create a new product', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const productService = new TenantProductService(context);

      const newProduct = {
        name: 'New Test Product',
        description: 'A new test product',
        category: 'Books',
        tenantId: testTenant.id,
      };

      const result = await productService.createProduct(newProduct);

      expect(result).toBeDefined();
      expect(result.name).toBe(newProduct.name);
      expect(result.description).toBe(newProduct.description);
      expect(result.category).toBe(newProduct.category);
      expect(result.tenantId).toBe(newProduct.tenantId);
    });

    it('should get products with tenant filtering', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const productService = new TenantProductService(context);

      const products = await productService.getProducts({
        tenantId: testTenant.id,
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      expect(products[0].tenantId).toBe(testTenant.id);
    });

    it('should get a single product by ID', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const productService = new TenantProductService(context);

      const product = await productService.getProductById(createdProduct.id, testTenant.id);

      expect(product).toBeDefined();
      expect(product.id).toBe(createdProduct.id);
      expect(product.name).toBe(testProduct.name);
      expect(product.tenantId).toBe(testTenant.id);
    });

    it('should update a product', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const productService = new TenantProductService(context);

      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description',
      };

      const updatedProduct = await productService.updateProduct(
        createdProduct.id,
        updateData,
        testTenant.id
      );

      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.description).toBe(updateData.description);
    });

    it('should delete a product', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const productService = new TenantProductService(context);

      await productService.deleteProduct(createdProduct.id, testTenant.id);

      // Verify product is deleted
      await expect(
        productService.getProductById(createdProduct.id, testTenant.id)
      ).rejects.toThrow('Product not found or access denied');
    });
  });

  describe('Product Variant Management', () => {
    it('should create a new variant with barcode validation', async () => {
      const { createTenantContext, TenantVariantService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const variantService = new TenantVariantService(context);

      const newVariant = {
        barcode: 'NEW123456789',
        weight: 2.0,
        price: 39.99,
        stock: 50,
        productId: createdProduct.id,
        tenantId: testTenant.id,
      };

      const result = await variantService.createVariant(newVariant);

      expect(result).toBeDefined();
      expect(result.barcode).toBe(newVariant.barcode);
      expect(result.weight).toBe(newVariant.weight);
      expect(result.price.toString()).toBe(newVariant.price.toString());
      expect(result.stock).toBe(newVariant.stock);
    });

    it('should prevent duplicate barcode creation', async () => {
      const { createTenantContext, TenantVariantService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const variantService = new TenantVariantService(context);

      const duplicateVariant = {
        barcode: testVariant.barcode, // Same barcode as existing variant
        weight: 2.0,
        price: 39.99,
        stock: 50,
        productId: createdProduct.id,
        tenantId: testTenant.id,
      };

      await expect(
        variantService.createVariant(duplicateVariant)
      ).rejects.toThrow();
    });

    it('should get variant by barcode', async () => {
      const { createTenantContext, TenantVariantService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const variantService = new TenantVariantService(context);

      const variant = await variantService.getVariantByBarcode(
        testVariant.barcode,
        testTenant.id
      );

      expect(variant).toBeDefined();
      expect(variant.barcode).toBe(testVariant.barcode);
      expect(variant.tenantId).toBe(testTenant.id);
    });

    it('should get variants for a product', async () => {
      const { createTenantContext, TenantVariantService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const variantService = new TenantVariantService(context);

      const variants = await variantService.getProductVariants(
        createdProduct.id,
        testTenant.id
      );

      expect(variants).toBeDefined();
      expect(Array.isArray(variants)).toBe(true);
      expect(variants.length).toBeGreaterThan(0);
      expect(variants[0].productId).toBe(createdProduct.id);
    });
  });

  describe('Stock Management with Concurrency Control', () => {
    it('should update variant stock atomically', async () => {
      const { createInventoryTransactionService } = await import('~/server/utils/inventory-transactions');
      const { createTenantContext } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const inventoryService = createInventoryTransactionService(context);

      const stockMovements = [
        {
          variantId: createdVariant.id,
          quantity: 10,
          type: 'IN' as const,
          reason: 'Test stock increase',
        },
      ];

      const result = await inventoryService.performStockMovements(
        stockMovements,
        testTenant.id
      );

      expect(result.success).toBe(true);
      expect(result.affectedVariants).toContain(createdVariant.id);

      // Verify stock was updated
      const updatedVariant = await prisma.productVariant.findUnique({
        where: { id: createdVariant.id },
      });
      expect(updatedVariant?.stock).toBe(testVariant.stock + 10);
    });

    it('should prevent negative stock', async () => {
      const { createInventoryTransactionService } = await import('~/server/utils/inventory-transactions');
      const { createTenantContext } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const inventoryService = createInventoryTransactionService(context);

      const stockMovements = [
        {
          variantId: createdVariant.id,
          quantity: testVariant.stock + 10, // More than available
          type: 'OUT' as const,
          reason: 'Test insufficient stock',
        },
      ];

      const result = await inventoryService.performStockMovements(
        stockMovements,
        testTenant.id
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Insufficient stock');
    });

    it('should perform bulk stock updates', async () => {
      const { createInventoryTransactionService } = await import('~/server/utils/inventory-transactions');
      const { createTenantContext } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const inventoryService = createInventoryTransactionService(context);

      const bulkUpdates = [
        {
          variantId: createdVariant.id,
          newStock: 75,
        },
      ];

      const result = await inventoryService.performBulkStockUpdate(
        bulkUpdates,
        testTenant.id
      );

      expect(result.success).toBe(true);
      expect(result.affectedVariants).toContain(createdVariant.id);

      // Verify stock was updated
      const updatedVariant = await prisma.productVariant.findUnique({
        where: { id: createdVariant.id },
      });
      expect(updatedVariant?.stock).toBe(75);
    });

    it('should get low stock variants', async () => {
      const { createInventoryTransactionService } = await import('~/server/utils/inventory-transactions');
      const { createTenantContext } = await import('~/server/utils/tenant-db');
      
      // First, reduce stock to below threshold
      await prisma.productVariant.update({
        where: { id: createdVariant.id },
        data: { stock: 5 },
      });

      const context = createTenantContext(createdAdminUser);
      const inventoryService = createInventoryTransactionService(context);

      const lowStockVariants = await inventoryService.getLowStockVariants(
        10,
        testTenant.id
      );

      expect(lowStockVariants).toBeDefined();
      expect(Array.isArray(lowStockVariants)).toBe(true);
      expect(lowStockVariants.length).toBeGreaterThan(0);
      expect(lowStockVariants[0].stock).toBeLessThanOrEqual(10);
    });
  });

  describe('Seller Product Access with Tenant Filtering', () => {
    it('should allow seller to access their tenant products', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdSellerUser);
      const productService = new TenantProductService(context);

      const products = await productService.getProducts({
        tenantId: testTenant.id,
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      expect(products[0].tenantId).toBe(testTenant.id);
    });

    it('should prevent seller from accessing other tenant products', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          id: 'other-tenant-id',
          name: 'Other Store',
        },
      });

      const context = createTenantContext(createdSellerUser);
      const productService = new TenantProductService(context);

      await expect(
        productService.getProducts({ tenantId: otherTenant.id })
      ).rejects.toThrow('Access denied: Cannot access data from different tenant');

      // Clean up
      await prisma.tenant.delete({ where: { id: otherTenant.id } });
    });

    it('should allow seller to get variant by barcode from their tenant', async () => {
      const { createTenantContext, TenantVariantService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdSellerUser);
      const variantService = new TenantVariantService(context);

      const variant = await variantService.getVariantByBarcode(
        testVariant.barcode,
        testTenant.id
      );

      expect(variant).toBeDefined();
      expect(variant.barcode).toBe(testVariant.barcode);
      expect(variant.tenantId).toBe(testTenant.id);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle invalid product data', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const productService = new TenantProductService(context);

      const invalidProduct = {
        name: '', // Empty name should fail
        tenantId: testTenant.id,
      };

      await expect(
        productService.createProduct(invalidProduct as any)
      ).rejects.toThrow();
    });

    it('should handle invalid variant data', async () => {
      const { createTenantContext, TenantVariantService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const variantService = new TenantVariantService(context);

      const invalidVariant = {
        barcode: 'INVALID',
        weight: -1, // Negative weight should fail
        price: -10, // Negative price should fail
        stock: -5, // Negative stock should fail
        productId: createdProduct.id,
        tenantId: testTenant.id,
      };

      await expect(
        variantService.createVariant(invalidVariant)
      ).rejects.toThrow();
    });

    it('should handle non-existent product access', async () => {
      const { createTenantContext, TenantProductService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const productService = new TenantProductService(context);

      await expect(
        productService.getProductById(99999, testTenant.id)
      ).rejects.toThrow('Product not found or access denied');
    });

    it('should handle non-existent variant barcode', async () => {
      const { createTenantContext, TenantVariantService } = await import('~/server/utils/tenant-db');
      
      const context = createTenantContext(createdAdminUser);
      const variantService = new TenantVariantService(context);

      await expect(
        variantService.getVariantByBarcode('NONEXISTENT', testTenant.id)
      ).rejects.toThrow('Product variant not found or access denied');
    });
  });
});