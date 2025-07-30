import { createTenantContext } from "~/server/utils/tenant-db";
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

    const context = createTenantContext(user);

    // Build where clause based on user role
    const whereClause = context.role === 'SELLER' && context.tenantId 
      ? { tenantId: context.tenantId } 
      : {};

    // Get total products count
    const totalProducts = await prisma.product.count({
      where: whereClause,
    });

    // Get total variants count
    const totalVariants = await prisma.productVariant.count({
      where: whereClause,
    });

    // Get low stock count (variants with stock < 10)
    const lowStockCount = await prisma.productVariant.count({
      where: {
        ...whereClause,
        stock: {
          lt: 10,
        },
      },
    });

    // Get out of stock count
    const outOfStockCount = await prisma.productVariant.count({
      where: {
        ...whereClause,
        stock: 0,
      },
    });

    // Get products by category
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get top products by total stock value
    const topProductsByValue = await prisma.product.findMany({
      where: whereClause,
      include: {
        variants: {
          select: {
            stock: true,
            price: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    });

    // Calculate stock values and sort
    const productsWithValue = topProductsByValue.map(product => {
      const totalValue = product.variants.reduce((sum, variant) => {
        return sum + (variant.stock * parseFloat(variant.price.toString()));
      }, 0);
      
      const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
      
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        tenantName: product.tenant.name,
        totalStock,
        totalValue,
        variantCount: product.variants.length,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);

    return {
      totalProducts,
      totalVariants,
      lowStockCount,
      outOfStockCount,
      productsByCategory: productsByCategory.map(item => ({
        category: item.category || 'Uncategorized',
        count: item._count.id,
      })),
      topProductsByValue: productsWithValue.slice(0, 5),
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});