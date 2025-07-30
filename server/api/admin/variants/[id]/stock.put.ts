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

    const id = getRouterParam(event, 'id');
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        message: "Invalid variant ID",
      });
    }

    const body = await readBody(event);
    const query = getQuery(event);
    const tenantId = query.tenantId as string | undefined;
    
    // Validate stock change
    if (typeof body.stockChange !== 'number' || isNaN(body.stockChange)) {
      throw createError({
        statusCode: 400,
        message: "Stock change must be a valid number",
      });
    }

    const context = createTenantContext(user);
    const variantService = new TenantVariantService(context);

    const updatedVariant = await variantService.updateVariantStock(
      parseInt(id), 
      body.stockChange, 
      tenantId
    );

    return updatedVariant;
  } catch (error: any) {
    if (error.message === "Product variant not found or access denied") {
      throw createError({
        statusCode: 404,
        message: "Product variant not found",
      });
    }
    
    if (error.message === "Insufficient stock") {
      throw createError({
        statusCode: 400,
        message: "Stock change would result in negative stock",
      });
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});