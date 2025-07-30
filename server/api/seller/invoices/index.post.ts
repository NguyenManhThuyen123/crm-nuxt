import { createTenantContext, TenantInvoiceService } from "~/server/utils/tenant-db";
import { z } from "zod";

// Validation schema for invoice creation
const createInvoiceSchema = z.object({
  items: z.array(z.object({
    variantId: z.number().int().positive("Variant ID must be a positive integer"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    unitPrice: z.number().positive("Unit price must be positive")
  })).min(1, "At least one item is required"),
  tenantId: z.string().optional() // Optional for sellers (will use their tenant)
});

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Sellers must be assigned to a tenant
    if (user.role === 'SELLER' && !user.tenantId) {
      throw createError({
        statusCode: 403,
        message: "Seller must be assigned to a tenant",
      });
    }

    const body = await readBody(event);
    
    // Validate request body
    let validatedData;
    try {
      validatedData = createInvoiceSchema.parse(body);
    } catch (error: any) {
      throw createError({
        statusCode: 400,
        message: "Invalid request data",
        data: error.errors
      });
    }

    // For sellers, always use their assigned tenant
    const tenantId = user.role === 'SELLER' ? user.tenantId! : validatedData.tenantId;
    
    if (!tenantId) {
      throw createError({
        statusCode: 400,
        message: "Tenant ID is required",
      });
    }

    // Additional validation for invoice items
    if (validatedData.items.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Invoice must contain at least one item",
      });
    }

    // Validate that all quantities are reasonable (not too high)
    const maxQuantityPerItem = 1000;
    for (const item of validatedData.items) {
      if (item.quantity > maxQuantityPerItem) {
        throw createError({
          statusCode: 400,
          message: `Quantity for variant ${item.variantId} exceeds maximum allowed (${maxQuantityPerItem})`,
        });
      }
    }

    // Validate that unit prices are reasonable
    const maxPricePerItem = 10000; // $10,000 max per item
    for (const item of validatedData.items) {
      if (item.unitPrice > maxPricePerItem) {
        throw createError({
          statusCode: 400,
          message: `Unit price for variant ${item.variantId} exceeds maximum allowed ($${maxPricePerItem})`,
        });
      }
    }

    // Calculate total amount for additional validation
    const totalAmount = validatedData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const maxInvoiceTotal = 50000; // $50,000 max per invoice
    
    if (totalAmount > maxInvoiceTotal) {
      throw createError({
        statusCode: 400,
        message: `Invoice total ($${totalAmount.toFixed(2)}) exceeds maximum allowed ($${maxInvoiceTotal})`,
      });
    }

    const context = createTenantContext(user);
    const invoiceService = new TenantInvoiceService(context);

    try {
      // Create invoice with automatic stock reduction
      const invoice = await invoiceService.createInvoice({
        items: validatedData.items,
        tenantId: tenantId
      });

      // Return the created invoice
      return {
        id: invoice?.id,
        totalAmount: invoice?.totalAmount,
        createdAt: invoice?.createdAt,
        items: invoice?.items?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          variant: {
            id: item.variant.id,
            barcode: item.variant.barcode,
            weight: item.variant.weight,
            price: item.variant.price,
            stock: item.variant.stock,
            product: {
              id: item.variant.product.id,
              name: item.variant.product.name,
              description: item.variant.product.description,
              category: item.variant.product.category
            }
          }
        })),
        user: {
          id: invoice?.user?.id,
          email: invoice?.user?.email,
          username: invoice?.user?.username
        },
        tenant: {
          id: invoice?.tenant?.id,
          name: invoice?.tenant?.name
        }
      };
    } catch (error: any) {
      // Handle specific business logic errors
      if (error.message.includes("not found")) {
        throw createError({
          statusCode: 404,
          message: error.message,
        });
      }
      
      if (error.message.includes("Insufficient stock")) {
        throw createError({
          statusCode: 422,
          message: error.message,
        });
      }
      
      if (error.message.includes("access denied") || error.message.includes("Access denied")) {
        throw createError({
          statusCode: 403,
          message: error.message,
        });
      }
      
      // Log the error for debugging
      console.error("Invoice creation error:", error);
      
      throw createError({
        statusCode: 500,
        message: "Failed to create invoice",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in invoice creation:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});