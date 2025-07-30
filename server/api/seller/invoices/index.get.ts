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

    const query = getQuery(event);
    
    // Parse query parameters
    const limit = query.limit ? parseInt(query.limit as string) : 50;
    const offset = query.offset ? parseInt(query.offset as string) : 0;
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
      // For sellers, tenantId will be automatically set to their assigned tenant
      const invoices = await invoiceService.getInvoices({
        tenantId: user.role === 'SELLER' ? user.tenantId! : undefined,
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

      // Get total count for proper pagination
      const totalCount = await invoiceService.getInvoicesCount({
        tenantId: user.role === 'SELLER' ? user.tenantId! : undefined,
        startDate,
        endDate
      });

      return {
        invoices: transformedInvoices,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: (offset + transformedInvoices.length) < totalCount
        },
        filters: {
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
      console.error("Invoice retrieval error:", error);
      
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
    console.error("Unexpected error in invoice retrieval:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});