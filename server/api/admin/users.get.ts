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

    // Only admins can view all users
    if (user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: "Admin privileges required",
      });
    }

    const query = getQuery(event);
    
    // Parse query parameters
    const limit = query.limit ? parseInt(query.limit as string) : 100;
    const offset = query.offset ? parseInt(query.offset as string) : 0;
    const role = query.role as string;

    // Validate query parameters
    if (limit < 1 || limit > 200) {
      throw createError({
        statusCode: 400,
        message: "Limit must be between 1 and 200",
      });
    }

    if (offset < 0) {
      throw createError({
        statusCode: 400,
        message: "Offset must be non-negative",
      });
    }

    try {
      // Build where clause
      const where: any = {};
      if (role && ['ADMIN', 'SELLER'].includes(role)) {
        where.role = role;
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error: any) {
      // Log the error for debugging
      console.error("Users retrieval error:", error);
      
      throw createError({
        statusCode: 500,
        message: "Failed to retrieve users",
      });
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Log unexpected errors
    console.error("Unexpected error in users retrieval:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});