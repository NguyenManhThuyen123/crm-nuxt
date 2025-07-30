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

    const query = getQuery(event);
    const tenantId = query.tenantId as string | undefined;
    const category = query.category as string | undefined;
    const limit = query.limit ? parseInt(query.limit as string) : undefined;
    const offset = query.offset ? parseInt(query.offset as string) : undefined;

    const context = createTenantContext(user);
    const productService = new TenantProductService(context);

    const products = await productService.getProducts({
      tenantId,
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