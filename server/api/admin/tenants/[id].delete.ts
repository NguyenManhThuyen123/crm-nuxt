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

    // Only admins can delete tenants
    if (user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: "Admin privileges required",
      });
    }

    const tenantId = getRouterParam(event, 'id');
    if (!tenantId) {
      throw createError({
        statusCode: 400,
        message: "Tenant ID is required",
      });
    }

    const context = createTenantContext(user);
    const tenantService = new TenantManagementService(context);

    try {
      await tenantService.deleteTenant(tenantId);

      return {
        success: true,
        message: "Tenant deleted successfully",
      };
    } catch (error: any) {
      // Log the error for debugging
      console.error("Tenant deletion error:", error);
      
      // Handle specific database errors
      if (error.code === 'P2025') {
        throw createError({
          statusCode: 404,
          message: "Tenant not found",
        });
      }
      
      // Handle foreign key constraint errors (tenant has related data)
      if (error.code === 'P2003') {
        throw createError({
          statusCode: 409,
          message: "Cannot delete tenant with existing users, products, or invoices",
        });
      }
      
      throw createError({
        statusCode: 500,
        message: "Failed to delete tenant",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in tenant deletion:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});