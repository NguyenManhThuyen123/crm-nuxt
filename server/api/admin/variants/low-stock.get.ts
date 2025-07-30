import { createTenantContext } from "~/server/utils/tenant-db";
import { createInventoryTransactionService } from "~/server/utils/inventory-transactions";

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
    const threshold = query.threshold ? parseInt(query.threshold as string) : 10;
    const tenantId = query.tenantId as string | undefined;

    if (isNaN(threshold) || threshold < 0) {
      throw createError({
        statusCode: 400,
        message: "Threshold must be a non-negative number",
      });
    }

    const context = createTenantContext(user);
    const inventoryService = createInventoryTransactionService(context);

    const lowStockVariants = await inventoryService.getLowStockVariants(threshold, tenantId);

    return lowStockVariants;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});