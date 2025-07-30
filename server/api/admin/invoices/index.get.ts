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

    // Only admins can access cross-tenant invoice data
    if (user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: "Admin privileges required",
      });
    }

    const query = getQuery(event);
    
    // Parse query parameters
    const limit = query.limit ? parseInt(query.limit as string) : 50;
    const offset = query.offset ? parseInt(query.offset as string) : 0;
    const tenantId = query.tenantId as string | undefined;
    const userId = query.userId ? parseInt(query.userId as string) : undefined;
    const startDate = query.startDate ? new Date(query.startDate as string) : undefined;
    const endDate = query.endDate ? new Date(query.endDate as string) : undefined;

    // Validate query parameters
    if (limit < 1 || limit > 100) {
      throw createError({
        statusCode: 400,
        message: "Limit must be between 1 and 100",
      });
    }

    if (offset < 0) {
      throw createError({
        statusCode: 400,
        message: "Offset must be non-negative",
      });
    }

    if (userId && userId < 1) {
      throw createError({
        statusCode: 400,
        message: "User ID must be a positive integer",
      });
    }

    if (startDate && isNaN(startDate.getTime())) {
      throw createError({
        statusCode: 400,
        message: "Invalid start date format",
      });
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw createError({
        statusCode: 400,
        message: "Invalid end date format",
      });
    }

    if (startDate && endDate && startDate > endDate) {
      throw createError({
        statusCode: 400,
        message: "Start date must be before end date",
      });
    }

    const context = createTenantContext(user);
    const invoiceService = new TenantInvoiceService(context);

    try {
      // Admin can access invoices across all tenants or filter by specific tenant
      const invoices = await invoiceService.getInvoices({
        tenantId,
        userId,
        startDate,
        endDate,
        limit,
        offset
      });

      // Transform the response to include only necessary data
      const transformedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        totalAmount: invoice.totalAmount,
        createdAt: invoice.createdAt,
        itemCount: invoice.items.length,
        items: invoice.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          variant: {
            id: item.variant.id,
            barcode: item.variant.barcode,
            weight: item.variant.weight,
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
      }));

      return {
        invoices: transformedInvoices,
        pagination: {
          limit,
          offset,
          total: transformedInvoices.length,
          hasMore: transformedInvoices.length === limit
        },
        filters: {
          tenantId,
          userId,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      };
    } catch (error: any) {
      // Handle specific business logic errors
      if (error.message.includes("access denied") || error.message.includes("Access denied")) {
        throw createError({
          statusCode: 403,
          message: error.message,
        });
      }
      
      // Log the error for debugging
      console.error("Admin invoice retrieval error:", error);
      
      throw createError({
        statusCode: 500,
        message: "Failed to retrieve invoices",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in admin invoice retrieval:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});