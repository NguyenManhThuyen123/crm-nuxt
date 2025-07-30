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

    const id = getRouterParam(event, 'id');
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        message: "Invalid product ID",
      });
    }

    const query = getQuery(event);
    const tenantId = query.tenantId as string | undefined;

    const context = createTenantContext(user);
    const productService = new TenantProductService(context);

    const product = await productService.getProductById(parseInt(id), tenantId);

    return product;
  } catch (error: any) {
    if (error.message === "Product not found or access denied") {
      throw createError({
        statusCode: 404,
        message: "Product not found",
      });
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});