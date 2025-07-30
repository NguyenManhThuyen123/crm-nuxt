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

    // Only admins can update tenants
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
    
    // Validate fields if provided
    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        throw createError({
          statusCode: 400,
          message: "Tenant name cannot be empty",
        });
      }

      if (body.name.length > 255) {
        throw createError({
          statusCode: 400,
          message: "Tenant name cannot exceed 255 characters",
        });
      }
    }

    if (body.address !== undefined && body.address !== null) {
      if (typeof body.address !== 'string' || body.address.length > 500) {
        throw createError({
          statusCode: 400,
          message: "Address must be a string and cannot exceed 500 characters",
        });
      }
    }

    if (body.contact !== undefined && body.contact !== null) {
      if (typeof body.contact !== 'string' || body.contact.length > 255) {
        throw createError({
          statusCode: 400,
          message: "Contact must be a string and cannot exceed 255 characters",
        });
      }
    }

    const context = createTenantContext(user);
    const tenantService = new TenantManagementService(context);

    try {
      // Prepare update data
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.address !== undefined) updateData.address = body.address?.trim() || null;
      if (body.contact !== undefined) updateData.contact = body.contact?.trim() || null;

      const tenant = await tenantService.updateTenant(tenantId, updateData);

      // Transform the response to include only necessary data
      return {
        id: tenant.id,
        name: tenant.name,
        address: tenant.address,
        contact: tenant.contact,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        userCount: tenant.users.length,
        users: tenant.users.map(user => ({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }))
      };
    } catch (error: any) {
      // Log the error for debugging
      console.error("Tenant update error:", error);
      
      // Handle specific database errors
      if (error.code === 'P2025') {
        throw createError({
          statusCode: 404,
          message: "Tenant not found",
        });
      }
      
      if (error.code === 'P2002') {
        throw createError({
          statusCode: 409,
          message: "A tenant with this name already exists",
        });
      }
      
      throw createError({
        statusCode: 500,
        message: "Failed to update tenant",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in tenant update:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});