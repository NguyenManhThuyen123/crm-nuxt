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

    // Only admins can remove users from tenants
    if (user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: "Admin privileges required",
      });
    }

    const tenantId = getRouterParam(event, 'id');
    const userIdParam = getRouterParam(event, 'userId');
    
    if (!tenantId) {
      throw createError({
        statusCode: 400,
        message: "Tenant ID is required",
      });
    }

    if (!userIdParam) {
      throw createError({
        statusCode: 400,
        message: "User ID is required",
      });
    }

    const userId = parseInt(userIdParam);
    if (isNaN(userId)) {
      throw createError({
        statusCode: 400,
        message: "User ID must be a valid number",
      });
    }

    try {
      // First verify the user exists and is assigned to this tenant
      const targetUser = await prisma.user.findFirst({
        where: { 
          id: userId,
          tenantId: tenantId
        },
      });

      if (!targetUser) {
        throw createError({
          statusCode: 404,
          message: "User not found in this tenant",
        });
      }

      // Remove user from tenant by setting tenantId to null
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { tenantId: null },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          tenantId: true,
        },
      });

      return {
        success: true,
        message: "User removed from tenant successfully",
        user: updatedUser
      };
    } catch (error: any) {
      // Log the error for debugging
      console.error("User removal from tenant error:", error);
      
      // If it's already a createError, re-throw it
      if (error.statusCode) {
        throw error;
      }
      
      // Handle specific database errors
      if (error.code === 'P2025') {
        throw createError({
          statusCode: 404,
          message: "User not found",
        });
      }
      
      throw createError({
        statusCode: 500,
        message: "Failed to remove user from tenant",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in user removal from tenant:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});