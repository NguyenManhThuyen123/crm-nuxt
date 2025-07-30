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

    // Only admins can assign users to tenants
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

    const body = await readBody(event);
    
    // Validate required fields
    if (!body.userId || typeof body.userId !== 'number') {
      throw createError({
        statusCode: 400,
        message: "User ID is required and must be a number",
      });
    }

    const context = createTenantContext(user);
    const tenantService = new TenantManagementService(context);

    try {
      const updatedUser = await tenantService.assignUserToTenant(body.userId, tenantId);

      // Transform the response to include only necessary data
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        tenantId: updatedUser.tenantId,
        tenant: updatedUser.tenant ? {
          id: updatedUser.tenant.id,
          name: updatedUser.tenant.name,
          address: updatedUser.tenant.address,
          contact: updatedUser.tenant.contact
        } : null
      };
    } catch (error: any) {
      // Log the error for debugging
      console.error("User-tenant assignment error:", error);
      
      // Handle specific database errors
      if (error.code === 'P2025') {
        throw createError({
          statusCode: 404,
          message: "User or tenant not found",
        });
      }
      
      if (error.code === 'P2003') {
        throw createError({
          statusCode: 400,
          message: "Invalid tenant ID",
        });
      }
      
      throw createError({
        statusCode: 500,
        message: "Failed to assign user to tenant",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in user-tenant assignment:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});