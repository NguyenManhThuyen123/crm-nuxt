import { createTenantContext, TenantVariantService } from "~/server/utils/tenant-db";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const productId = getRouterParam(event, 'id');
    if (!productId || isNaN(parseInt(productId))) {
      throw createError({
        statusCode: 400,
        message: "Invalid product ID",
      });
    }

    const query = getQuery(event);
    const tenantId = query.tenantId as string | undefined;

    const context = createTenantContext(user);
    const variantService = new TenantVariantService(context);

    const variants = await variantService.getProductVariants(parseInt(productId), tenantId);

    return variants;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});