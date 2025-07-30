import { PrismaClient, UserRole, Prisma } from "@prisma/client";
import { prisma } from "./db";

/**
 * Multi-tenant database service utilities
 * Provides tenant-aware database operations with automatic filtering for sellers
 * and admin-level access that bypasses tenant restrictions
 */

export interface TenantContext {
  userId: number;
  role: UserRole;
  tenantId?: string | null;
}

/**
 * Base class for tenant-aware database operations
 */
export class TenantAwareService {
  protected prisma: PrismaClient;
  protected context: TenantContext;

  constructor(context: TenantContext) {
    this.prisma = prisma;
    this.context = context;
  }

  /**
   * Validates tenant access for seller operations
   * Throws error if seller tries to access data outside their tenant
   */
  protected validateTenantAccess(tenantId?: string | null): void {
    if (this.context.role === UserRole.SELLER) {
      if (!this.context.tenantId) {
        throw new Error("Seller must be assigned to a tenant");
      }
      if (tenantId && tenantId !== this.context.tenantId) {
        throw new Error("Access denied: Cannot access data from different tenant");
      }
    }
  }

  /**
   * Gets the effective tenant ID for queries
   * For sellers: always use their assigned tenant
   * For admins: use provided tenant or null for cross-tenant access
   */
  protected getEffectiveTenantId(requestedTenantId?: string | null): string | null {
    if (this.context.role === UserRole.SELLER) {
      return this.context.tenantId || null;
    }
    return requestedTenantId || null;
  }

  /**
   * Creates tenant filter for Prisma queries
   * Returns empty object for admin cross-tenant queries
   */
  protected createTenantFilter(tenantId?: string | null): { tenantId?: string } {
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);
    return effectiveTenantId ? { tenantId: effectiveTenantId } : {};
  }
}

/**
 * Product management service with tenant awareness
 */
export class TenantProductService extends TenantAwareService {
  /**
   * Get products with automatic tenant filtering
   */
  async getProducts(options: {
    tenantId?: string;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    this.validateTenantAccess(options.tenantId);
    
    const where = {
      ...this.createTenantFilter(options.tenantId),
      ...(options.category && { category: options.category }),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        variants: true,
        tenant: true,
      },
      take: options.limit,
      skip: options.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single product by ID with tenant validation
   */
  async getProductById(id: number, tenantId?: string) {
    this.validateTenantAccess(tenantId);
    
    const where = {
      id,
      ...this.createTenantFilter(tenantId),
    };

    const product = await this.prisma.product.findFirst({
      where,
      include: {
        variants: true,
        tenant: true,
      },
    });

    if (!product) {
      throw new Error("Product not found or access denied");
    }

    return product;
  }

  /**
   * Create product (admin only or within seller's tenant)
   */
  async createProduct(data: {
    name: string;
    description?: string;
    category?: string;
    tenantId: string;
  }) {
    this.validateTenantAccess(data.tenantId);
    
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Product name is required and cannot be empty");
    }
    
    if (data.name.length > 255) {
      throw new Error("Product name cannot exceed 255 characters");
    }
    
    if (data.description && data.description.length > 1000) {
      throw new Error("Product description cannot exceed 1000 characters");
    }
    
    if (data.category && data.category.length > 100) {
      throw new Error("Product category cannot exceed 100 characters");
    }
    
    return this.prisma.product.create({
      data: {
        ...data,
        tenantId: this.getEffectiveTenantId(data.tenantId)!,
      },
      include: {
        variants: true,
        tenant: true,
      },
    });
  }

  /**
   * Update product with tenant validation
   */
  async updateProduct(id: number, data: {
    name?: string;
    description?: string;
    category?: string;
  }, tenantId?: string) {
    // First verify the product exists and user has access
    await this.getProductById(id, tenantId);
    
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
        tenant: true,
      },
    });
  }

  /**
   * Delete product with tenant validation
   */
  async deleteProduct(id: number, tenantId?: string) {
    // First verify the product exists and user has access
    await this.getProductById(id, tenantId);
    
    // Delete all variants first, then the product
    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({
        where: { productId: id },
      });
      
      return tx.product.delete({
        where: { id },
      });
    });
  }
}

/**
 * Product variant service with tenant awareness
 */
export class TenantVariantService extends TenantAwareService {
  /**
   * Get variant by barcode with tenant filtering
   */
  async getVariantByBarcode(barcode: string, tenantId?: string) {
    this.validateTenantAccess(tenantId);
    
    const where = {
      barcode,
      ...this.createTenantFilter(tenantId),
    };

    const variant = await this.prisma.productVariant.findFirst({
      where,
      include: {
        product: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!variant) {
      throw new Error("Product variant not found or access denied");
    }

    return variant;
  }

  /**
   * Get variants for a product with tenant validation
   */
  async getProductVariants(productId: number, tenantId?: string) {
    this.validateTenantAccess(tenantId);
    
    const where = {
      productId,
      ...this.createTenantFilter(tenantId),
    };

    return this.prisma.productVariant.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create product variant with tenant validation
   */
  async createVariant(data: {
    barcode: string;
    weight: number;
    price: number;
    stock: number;
    productId: number;
    tenantId: string;
  }) {
    this.validateTenantAccess(data.tenantId);
    
    // Validate required fields and constraints
    if (!data.barcode || data.barcode.trim().length === 0) {
      throw new Error("Barcode is required and cannot be empty");
    }
    
    if (data.barcode.length > 100) {
      throw new Error("Barcode cannot exceed 100 characters");
    }
    
    if (data.weight < 0) {
      throw new Error("Weight cannot be negative");
    }
    
    if (data.price < 0) {
      throw new Error("Price cannot be negative");
    }
    
    if (data.stock < 0) {
      throw new Error("Stock cannot be negative");
    }
    
    // Verify the product exists and user has access
    const productService = new TenantProductService(this.context);
    await productService.getProductById(data.productId, data.tenantId);
    
    return this.prisma.productVariant.create({
      data: {
        ...data,
        tenantId: this.getEffectiveTenantId(data.tenantId)!,
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Update variant stock with tenant validation
   */
  async updateVariantStock(id: number, stockChange: number, tenantId?: string) {
    this.validateTenantAccess(tenantId);
    
    const where = {
      id,
      ...this.createTenantFilter(tenantId),
    };

    const variant = await this.prisma.productVariant.findFirst({ where });
    if (!variant) {
      throw new Error("Product variant not found or access denied");
    }

    const newStock = variant.stock + stockChange;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    return this.prisma.productVariant.update({
      where: { id },
      data: { stock: newStock },
      include: {
        product: true,
      },
    });
  }
}

/**
 * Invoice service with tenant awareness
 */
export class TenantInvoiceService extends TenantAwareService {
  /**
   * Get invoices with tenant filtering
   */
  async getInvoices(options: {
    tenantId?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    this.validateTenantAccess(options.tenantId);
    
    const where: any = {
      ...this.createTenantFilter(options.tenantId),
    };

    // For sellers, only show their own invoices unless admin specifies userId
    if (this.context.role === UserRole.SELLER) {
      where.userId = this.context.userId;
    } else if (options.userId) {
      where.userId = options.userId;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        tenant: true,
      },
      take: options.limit,
      skip: options.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get count of invoices with tenant filtering
   */
  async getInvoicesCount(options: {
    tenantId?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    this.validateTenantAccess(options.tenantId);
    
    const where: any = {
      ...this.createTenantFilter(options.tenantId),
    };

    // For sellers, only count their own invoices unless admin specifies userId
    if (this.context.role === UserRole.SELLER) {
      where.userId = this.context.userId;
    } else if (options.userId) {
      where.userId = options.userId;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return this.prisma.invoice.count({ where });
  }

  /**
   * Get single invoice by ID with tenant validation
   */
  async getInvoiceById(id: number, tenantId?: string) {
    this.validateTenantAccess(tenantId);
    
    const where: any = {
      id,
      ...this.createTenantFilter(tenantId),
    };

    // For sellers, only allow access to their own invoices
    if (this.context.role === UserRole.SELLER) {
      where.userId = this.context.userId;
    }

    const invoice = await this.prisma.invoice.findFirst({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        tenant: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found or access denied");
    }

    return invoice;
  }

  /**
   * Create invoice with automatic stock reduction
   */
  async createInvoice(data: {
    items: Array<{
      variantId: number;
      quantity: number;
      unitPrice: number;
    }>;
    tenantId: string;
  }) {
    this.validateTenantAccess(data.tenantId);
    
    const effectiveTenantId = this.getEffectiveTenantId(data.tenantId)!;
    
    return this.prisma.$transaction(async (tx) => {
      // Validate all variants exist and have sufficient stock
      const variantService = new TenantVariantService(this.context);
      const variants = [];
      
      for (const item of data.items) {
        const variant = await tx.productVariant.findFirst({
          where: {
            id: item.variantId,
            tenantId: effectiveTenantId,
          },
        });
        
        if (!variant) {
          throw new Error(`Product variant ${item.variantId} not found`);
        }
        
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${item.variantId}. Available: ${variant.stock}, Requested: ${item.quantity}`);
        }
        
        variants.push(variant);
      }
      
      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          totalAmount,
          userId: this.context.userId,
          tenantId: effectiveTenantId,
        },
      });
      
      // Create invoice items and update stock
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const variant = variants[i];
        
        // Create invoice item
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          },
        });
        
        // Update variant stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: variant.stock - item.quantity },
        });
      }
      
      // Return complete invoice with items
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          tenant: true,
        },
      });
    });
  }
}

/**
 * Tenant management service (admin only)
 */
export class TenantManagementService extends TenantAwareService {
  constructor(context: TenantContext) {
    super(context);
    if (context.role !== UserRole.ADMIN) {
      throw new Error("Tenant management requires admin privileges");
    }
  }

  /**
   * Get all tenants (admin only)
   */
  async getTenants(options: {
    limit?: number;
    offset?: number;
  } = {}) {
    return this.prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        _count: {
          select: {
            products: true,
            invoices: true,
          },
        },
      },
      take: options.limit,
      skip: options.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create new tenant (admin only)
   */
  async createTenant(data: {
    name: string;
    address?: string;
    contact?: string;
  }) {
    return this.prisma.tenant.create({
      data,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update tenant (admin only)
   */
  async updateTenant(id: string, data: {
    name?: string;
    address?: string;
    contact?: string;
  }) {
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Delete tenant (admin only)
   */
  async deleteTenant(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  /**
   * Assign user to tenant (admin only)
   */
  async assignUserToTenant(userId: number, tenantId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { tenantId },
      include: {
        tenant: true,
      },
    });
  }
}

/**
 * Factory function to create tenant-aware services
 */
export function createTenantServices(context: TenantContext) {
  return {
    products: new TenantProductService(context),
    variants: new TenantVariantService(context),
    invoices: new TenantInvoiceService(context),
    tenants: context.role === UserRole.ADMIN ? new TenantManagementService(context) : null,
  };
}

/**
 * Helper function to extract tenant context from user
 */
export function createTenantContext(user: { id: number; role: UserRole; tenantId?: string | null }): TenantContext {
  return {
    userId: user.id,
    role: user.role,
    tenantId: user.tenantId,
  };
}