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

    // Sellers can only access their own tenant's variants
    if (!user.tenantId) {
      throw createError({
        statusCode: 403,
        message: "Seller must be assigned to a tenant",
      });
    }

    const barcode = getRouterParam(event, 'barcode');
    if (!barcode) {
      throw createError({
        statusCode: 400,
        message: "Barcode is required",
      });
    }

    const context = createTenantContext(user);
    const variantService = new TenantVariantService(context);

    try {
      // For sellers, automatically filter by their tenant
      const variant = await variantService.getVariantByBarcode(barcode, user.tenantId);
      return variant;
    } catch (error: any) {
      if (error.message === "Product variant not found or access denied") {
        throw createError({
          statusCode: 404,
          message: "Product variant not found",
        });
      }
      throw error;
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});