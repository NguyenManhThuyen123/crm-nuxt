import { prisma } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Only admins can view tenant users
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

    try {
      // First verify the tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw createError({
          statusCode: 404,
          message: "Tenant not found",
        });
      }

      // Get users for this tenant
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error: any) {
      // Log the error for debugging
      console.error("Tenant users retrieval error:", error);
      
      // If it's already a createError, re-throw it
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        message: "Failed to retrieve tenant users",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in tenant users retrieval:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});