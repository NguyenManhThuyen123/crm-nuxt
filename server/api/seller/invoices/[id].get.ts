import { createTenantContext, TenantInvoiceService } from "~/server/utils/tenant-db";

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

    const invoiceId = parseInt(getRouterParam(event, 'id') as string);
    
    if (!invoiceId || invoiceId < 1) {
      throw createError({
        statusCode: 400,
        message: "Invalid invoice ID",
      });
    }

    const context = createTenantContext(user);
    const invoiceService = new TenantInvoiceService(context);

    try {
      // For sellers, this will automatically filter by their tenant and user ID
      const invoice = await invoiceService.getInvoiceById(invoiceId, user.role === 'SELLER' ? user.tenantId! : undefined);

      // Transform the response to include detailed information
      return {
        id: invoice.id,
        totalAmount: invoice.totalAmount,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        items: invoice.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          createdAt: item.createdAt,
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
          id: invoice.user.id,
          email: invoice.user.email,
          username: invoice.user.username
        },
        tenant: {
          id: invoice.tenant.id,
          name: invoice.tenant.name
        }
      };
    } catch (error: any) {
      // Handle specific business logic errors
      if (error.message.includes("not found") || error.message.includes("access denied")) {
        throw createError({
          statusCode: 404,
          message: "Invoice not found or access denied",
        });
      }
      
      // Log the error for debugging
      console.error("Invoice detail retrieval error:", error);
      
      throw createError({
        statusCode: 500,
        message: "Failed to retrieve invoice details",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in invoice detail retrieval:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});