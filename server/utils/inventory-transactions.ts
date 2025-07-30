import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { TenantContext } from "./tenant-db";

/**
 * Inventory transaction utilities for atomic operations
 * Ensures data consistency during complex inventory operations
 */

export interface StockMovement {
  variantId: number;
  quantity: number;
  type: "IN" | "OUT";
  reason: string;
}

export interface BulkStockUpdate {
  variantId: number;
  newStock: number;
}

export interface InventoryTransactionResult {
  success: boolean;
  affectedVariants: number[];
  errors?: string[];
}

/**
 * Inventory transaction service for atomic operations
 */
export class InventoryTransactionService {
  private prisma: PrismaClient;
  private context: TenantContext;

  constructor(context: TenantContext) {
    this.prisma = prisma;
    this.context = context;
  }

  /**
   * Validates tenant access for inventory operations
   */
  private validateTenantAccess(tenantId?: string | null): void {
    if (this.context.role === "SELLER") {
      if (!this.context.tenantId) {
        throw new Error("Seller must be assigned to a tenant");
      }
      if (tenantId && tenantId !== this.context.tenantId) {
        throw new Error("Access denied: Cannot access inventory from different tenant");
      }
    }
  }

  /**
   * Gets the effective tenant ID for operations
   */
  private getEffectiveTenantId(requestedTenantId?: string | null): string | null {
    if (this.context.role === "SELLER") {
      return this.context.tenantId || null;
    }
    return requestedTenantId || null;
  }

  /**
   * Performs atomic stock movements for multiple variants
   * Used for sales, returns, adjustments, etc.
   */
  async performStockMovements(
    movements: StockMovement[],
    tenantId?: string
  ): Promise<InventoryTransactionResult> {
    this.validateTenantAccess(tenantId);
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);

    return this.prisma.$transaction(async (tx) => {
      const affectedVariants: number[] = [];
      const errors: string[] = [];

      try {
        // First, validate all variants exist and belong to the correct tenant
        for (const movement of movements) {
          const variant = await tx.productVariant.findFirst({
            where: {
              id: movement.variantId,
              ...(effectiveTenantId && { tenantId: effectiveTenantId }),
            },
          });

          if (!variant) {
            errors.push(`Variant ${movement.variantId} not found or access denied`);
            continue;
          }

          // For OUT movements, check if sufficient stock is available
          if (movement.type === "OUT" && variant.stock < movement.quantity) {
            errors.push(
              `Insufficient stock for variant ${movement.variantId}. ` +
                `Available: ${variant.stock}, Requested: ${movement.quantity}`
            );
            continue;
          }

          affectedVariants.push(movement.variantId);
        }

        // If there are validation errors, throw to rollback transaction
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(", ")}`);
        }

        // Perform all stock movements
        for (const movement of movements) {
          const stockChange = movement.type === "IN" ? movement.quantity : -movement.quantity;

          await tx.productVariant.update({
            where: { id: movement.variantId },
            data: {
              stock: {
                increment: stockChange,
              },
            },
          });
        }

        return {
          success: true,
          affectedVariants,
        };
      } catch (error) {
        return {
          success: false,
          affectedVariants: [],
          errors: [error instanceof Error ? error.message : "Unknown error occurred"],
        };
      }
    });
  }

  /**
   * Performs bulk stock updates with validation
   * Used for inventory adjustments and corrections
   */
  async performBulkStockUpdate(
    updates: BulkStockUpdate[],
    tenantId?: string
  ): Promise<InventoryTransactionResult> {
    this.validateTenantAccess(tenantId);
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);

    return this.prisma.$transaction(async (tx) => {
      const affectedVariants: number[] = [];
      const errors: string[] = [];

      try {
        // Validate all variants exist and belong to the correct tenant
        for (const update of updates) {
          if (update.newStock < 0) {
            errors.push(`Invalid stock value for variant ${update.variantId}: ${update.newStock}`);
            continue;
          }

          const variant = await tx.productVariant.findFirst({
            where: {
              id: update.variantId,
              ...(effectiveTenantId && { tenantId: effectiveTenantId }),
            },
          });

          if (!variant) {
            errors.push(`Variant ${update.variantId} not found or access denied`);
            continue;
          }

          affectedVariants.push(update.variantId);
        }

        // If there are validation errors, throw to rollback transaction
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(", ")}`);
        }

        // Perform all stock updates
        for (const update of updates) {
          await tx.productVariant.update({
            where: { id: update.variantId },
            data: { stock: update.newStock },
          });
        }

        return {
          success: true,
          affectedVariants,
        };
      } catch (error) {
        return {
          success: false,
          affectedVariants: [],
          errors: [error instanceof Error ? error.message : "Unknown error occurred"],
        };
      }
    });
  }

  /**
   * Creates an invoice with automatic stock reduction
   * Ensures atomicity between invoice creation and stock updates
   */
  async createInvoiceWithStockReduction(data: {
    items: Array<{
      variantId: number;
      quantity: number;
      unitPrice: number;
    }>;
    tenantId: string;
  }): Promise<any> {
    this.validateTenantAccess(data.tenantId);
    const effectiveTenantId = this.getEffectiveTenantId(data.tenantId)!;

    return this.prisma.$transaction(async (tx) => {
      // Validate all variants and check stock availability
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
          throw new Error(
            `Insufficient stock for variant ${item.variantId}. ` +
              `Available: ${variant.stock}, Requested: ${item.quantity}`
          );
        }

        variants.push(variant);
      }

      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          totalAmount,
          userId: this.context.userId,
          tenantId: effectiveTenantId,
        },
      });

      // Create invoice items and update stock atomically
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

  /**
   * Transfers stock between variants (for product variant changes)
   * Ensures atomic transfer without stock loss
   */
  async transferStockBetweenVariants(
    fromVariantId: number,
    toVariantId: number,
    quantity: number,
    tenantId?: string
  ): Promise<InventoryTransactionResult> {
    this.validateTenantAccess(tenantId);
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);

    return this.prisma.$transaction(async (tx) => {
      try {
        // Validate both variants exist and belong to the correct tenant
        const fromVariant = await tx.productVariant.findFirst({
          where: {
            id: fromVariantId,
            ...(effectiveTenantId && { tenantId: effectiveTenantId }),
          },
        });

        const toVariant = await tx.productVariant.findFirst({
          where: {
            id: toVariantId,
            ...(effectiveTenantId && { tenantId: effectiveTenantId }),
          },
        });

        if (!fromVariant) {
          throw new Error(`Source variant ${fromVariantId} not found or access denied`);
        }

        if (!toVariant) {
          throw new Error(`Target variant ${toVariantId} not found or access denied`);
        }

        if (fromVariant.stock < quantity) {
          throw new Error(
            `Insufficient stock in source variant ${fromVariantId}. ` +
              `Available: ${fromVariant.stock}, Requested: ${quantity}`
          );
        }

        // Perform atomic transfer
        await tx.productVariant.update({
          where: { id: fromVariantId },
          data: { stock: fromVariant.stock - quantity },
        });

        await tx.productVariant.update({
          where: { id: toVariantId },
          data: { stock: toVariant.stock + quantity },
        });

        return {
          success: true,
          affectedVariants: [fromVariantId, toVariantId],
        };
      } catch (error) {
        return {
          success: false,
          affectedVariants: [],
          errors: [error instanceof Error ? error.message : "Unknown error occurred"],
        };
      }
    });
  }

  /**
   * Reserves stock for pending orders (future enhancement)
   * Creates temporary stock reservations that can be committed or released
   */
  async reserveStock(
    reservations: Array<{
      variantId: number;
      quantity: number;
      reservationId: string;
    }>,
    tenantId?: string
  ): Promise<InventoryTransactionResult> {
    this.validateTenantAccess(tenantId);
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);

    // Note: This would require a stock_reservations table in a full implementation
    // For now, we'll simulate by checking availability without actually reserving
    return this.prisma.$transaction(async (tx) => {
      const affectedVariants: number[] = [];
      const errors: string[] = [];

      try {
        for (const reservation of reservations) {
          const variant = await tx.productVariant.findFirst({
            where: {
              id: reservation.variantId,
              ...(effectiveTenantId && { tenantId: effectiveTenantId }),
            },
          });

          if (!variant) {
            errors.push(`Variant ${reservation.variantId} not found or access denied`);
            continue;
          }

          if (variant.stock < reservation.quantity) {
            errors.push(
              `Insufficient stock for reservation of variant ${reservation.variantId}. ` +
                `Available: ${variant.stock}, Requested: ${reservation.quantity}`
            );
            continue;
          }

          affectedVariants.push(reservation.variantId);
        }

        if (errors.length > 0) {
          throw new Error(`Reservation validation failed: ${errors.join(", ")}`);
        }

        // In a full implementation, create reservation records here
        // For now, just return success if validation passed
        return {
          success: true,
          affectedVariants,
        };
      } catch (error) {
        return {
          success: false,
          affectedVariants: [],
          errors: [error instanceof Error ? error.message : "Unknown error occurred"],
        };
      }
    });
  }

  /**
   * Gets current stock levels for variants with low stock alerts
   */
  async getLowStockVariants(threshold: number = 10, tenantId?: string): Promise<any[]> {
    this.validateTenantAccess(tenantId);
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);

    return this.prisma.productVariant.findMany({
      where: {
        stock: {
          lte: threshold,
        },
        ...(effectiveTenantId && { tenantId: effectiveTenantId }),
      },
      include: {
        product: {
          include: {
            tenant: true,
          },
        },
      },
      orderBy: { stock: "asc" },
    });
  }

  /**
   * Gets stock movement history (would require audit table in full implementation)
   * For now, returns recent invoice items as stock movements
   */
  async getStockMovementHistory(
    variantId?: number,
    tenantId?: string,
    limit: number = 50
  ): Promise<any[]> {
    this.validateTenantAccess(tenantId);
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);

    const where: any = {};

    if (variantId) {
      where.variantId = variantId;
    }

    if (effectiveTenantId) {
      where.variant = {
        tenantId: effectiveTenantId,
      };
    }

    return this.prisma.invoiceItem.findMany({
      where,
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        invoice: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

/**
 * Factory function to create inventory transaction service
 */
export function createInventoryTransactionService(context: TenantContext) {
  return new InventoryTransactionService(context);
}
