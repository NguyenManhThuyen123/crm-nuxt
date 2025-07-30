import { createTenantContext, TenantManagementService } from "~/server/utils/tenant-db";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Only admins can access tenant management
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

    const context = createTenantContext(user);
    const tenantService = new TenantManagementService(context);

    try {
      const tenants = await tenantService.getTenants({
        limit,
        offset
      });

      // Transform the response to include only necessary data
      const transformedTenants = tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        address: tenant.address,
        contact: tenant.contact,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        userCount: tenant.users.length,
        productCount: tenant._count.products,
        invoiceCount: tenant._count.invoices,
        users: tenant.users.map(user => ({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }))
      }));

      return transformedTenants;
    } catch (error: any) {
      // Log the error for debugging
      console.error("Tenant retrieval error:", error);
      
      throw createError({
        statusCode: 500,
        message: "Failed to retrieve tenants",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in tenant retrieval:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});