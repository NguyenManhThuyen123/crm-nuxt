import { createTenantContext } from "~/server/utils/tenant-db";
import { prisma } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const id = getRouterParam(event, 'id');
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        message: "Invalid variant ID",
      });
    }

    const query = getQuery(event);
    const tenantId = query.tenantId as string | undefined;
    
    const context = createTenantContext(user);
    
    // First verify the variant exists and user has access
    const whereClause: any = {
      id: parseInt(id),
    };
    
    if (context.role === 'SELLER' && context.tenantId) {
      whereClause.tenantId = context.tenantId;
    } else if (tenantId) {
      whereClause.tenantId = tenantId;
    }
    
    const variant = await prisma.productVariant.findFirst({
      where: whereClause,
      include: {
        product: true,
        invoiceItems: true,
      },
    });

    if (!variant) {
      throw createError({
        statusCode: 404,
        message: "Product variant not found or access denied",
      });
    }

    // Check if variant has been used in any invoices
    if (variant.invoiceItems.length > 0) {
      throw createError({
        statusCode: 409,
        message: "Cannot delete variant that has been used in invoices",
      });
    }

    // Delete the variant
    await prisma.productVariant.delete({
      where: { id: parseInt(id) },
    });

    return { success: true, message: "Variant deleted successfully" };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});