import { createTenantContext, TenantProductService } from "~/server/utils/tenant-db";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Sellers can only access their own tenant's products
    if (!user.tenantId) {
      throw createError({
        statusCode: 403,
        message: "Seller must be assigned to a tenant",
      });
    }

    const query = getQuery(event);
    const category = query.category as string | undefined;
    const limit = query.limit ? parseInt(query.limit as string) : undefined;
    const offset = query.offset ? parseInt(query.offset as string) : undefined;

    const context = createTenantContext(user);
    const productService = new TenantProductService(context);

    // For sellers, automatically filter by their tenant
    const products = await productService.getProducts({
      tenantId: user.tenantId,
      category,
      limit,
      offset,
    });

    return products;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});