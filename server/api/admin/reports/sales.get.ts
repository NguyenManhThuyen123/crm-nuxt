import { createTenantContext, TenantInvoiceService } from "~/server/utils/tenant-db";
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

    // Only admins can access sales reports
    if (user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: "Admin privileges required",
      });
    }

    const query = getQuery(event);
    
    // Parse query parameters
    const tenantId = query.tenantId as string | undefined;
    const startDate = query.startDate ? new Date(query.startDate as string) : undefined;
    const endDate = query.endDate ? new Date(query.endDate as string) : undefined;
    const groupBy = query.groupBy as string || 'day'; // day, week, month
    const includeDetails = query.includeDetails === 'true';

    // Validate query parameters
    if (startDate && isNaN(startDate.getTime())) {
      throw createError({
        statusCode: 400,
        message: "Invalid start date format",
      });
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw createError({
        statusCode: 400,
        message: "Invalid end date format",
      });
    }

    if (startDate && endDate && startDate > endDate) {
      throw createError({
        statusCode: 400,
        message: "Start date must be before end date",
      });
    }

    if (!['day', 'week', 'month'].includes(groupBy)) {
      throw createError({
        statusCode: 400,
        message: "Invalid groupBy parameter. Must be 'day', 'week', or 'month'",
      });
    }

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = endDate || new Date();
    const defaultStartDate = startDate || new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Build where clause for filtering
      const whereClause: any = {
        createdAt: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
      };

      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      // Get sales data with aggregations
      const salesData = await prisma.invoice.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate summary statistics
      const totalRevenue = salesData.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
      const totalInvoices = salesData.length;
      const totalItems = salesData.reduce((sum, invoice) => sum + invoice.items.length, 0);
      const totalQuantity = salesData.reduce((sum, invoice) => 
        sum + invoice.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

      // Calculate average order value
      const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      // Group sales by time period
      const salesByPeriod = groupSalesByPeriod(salesData, groupBy);

      // Calculate top products
      const productSales = new Map<string, {
        productId: number;
        productName: string;
        category: string | null;
        totalQuantity: number;
        totalRevenue: number;
        invoiceCount: number;
      }>();

      salesData.forEach(invoice => {
        invoice.items.forEach(item => {
          const key = `${item.variant.product.id}`;
          const existing = productSales.get(key) || {
            productId: item.variant.product.id,
            productName: item.variant.product.name,
            category: item.variant.product.category,
            totalQuantity: 0,
            totalRevenue: 0,
            invoiceCount: 0,
          };

          existing.totalQuantity += item.quantity;
          existing.totalRevenue += Number(item.totalPrice);
          existing.invoiceCount += 1;

          productSales.set(key, existing);
        });
      });

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Calculate sales by tenant (if admin is viewing all tenants)
      const salesByTenant = new Map<string, {
        tenantId: string;
        tenantName: string;
        totalRevenue: number;
        totalInvoices: number;
        totalItems: number;
      }>();

      salesData.forEach(invoice => {
        const key = invoice.tenantId;
        const existing = salesByTenant.get(key) || {
          tenantId: invoice.tenant.id,
          tenantName: invoice.tenant.name,
          totalRevenue: 0,
          totalInvoices: 0,
          totalItems: 0,
        };

        existing.totalRevenue += Number(invoice.totalAmount);
        existing.totalInvoices += 1;
        existing.totalItems += invoice.items.length;

        salesByTenant.set(key, existing);
      });

      const tenantSummary = Array.from(salesByTenant.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Calculate inventory levels (current stock)
      const inventoryLevels = await prisma.productVariant.groupBy({
        by: ['tenantId'],
        where: tenantId ? { tenantId } : {},
        _sum: {
          stock: true,
        },
        _count: {
          id: true,
        },
      });

      const inventoryByTenant = await Promise.all(
        inventoryLevels.map(async (level) => {
          const tenant = await prisma.tenant.findUnique({
            where: { id: level.tenantId },
            select: { id: true, name: true },
          });

          const lowStockCount = await prisma.productVariant.count({
            where: {
              tenantId: level.tenantId,
              stock: {
                lte: 10, // Consider items with 10 or fewer as low stock
              },
            },
          });

          return {
            tenantId: level.tenantId,
            tenantName: tenant?.name || 'Unknown',
            totalStock: level._sum.stock || 0,
            totalVariants: level._count.id,
            lowStockCount,
          };
        })
      );

      // Build response
      const response: any = {
        summary: {
          totalRevenue,
          totalInvoices,
          totalItems,
          totalQuantity,
          averageOrderValue,
          dateRange: {
            startDate: defaultStartDate.toISOString(),
            endDate: defaultEndDate.toISOString(),
          },
        },
        salesByPeriod,
        topProducts,
        tenantSummary,
        inventoryLevels: inventoryByTenant,
        filters: {
          tenantId,
          startDate: defaultStartDate.toISOString(),
          endDate: defaultEndDate.toISOString(),
          groupBy,
        },
      };

      // Include detailed invoice data if requested
      if (includeDetails) {
        response.invoices = salesData.map(invoice => ({
          id: invoice.id,
          totalAmount: invoice.totalAmount,
          createdAt: invoice.createdAt,
          itemCount: invoice.items.length,
          items: invoice.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            variant: {
              id: item.variant.id,
              barcode: item.variant.barcode,
              weight: item.variant.weight,
              product: {
                id: item.variant.product.id,
                name: item.variant.product.name,
                category: item.variant.product.category,
              },
            },
          })),
          user: invoice.user,
          tenant: invoice.tenant,
        }));
      }

      return response;
    } catch (error: any) {
      console.error("Sales report generation error:", error);
      
      throw createError({
        statusCode: 500,
        message: "Failed to generate sales report",
      });
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    console.error("Unexpected error in sales report:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

/**
 * Groups sales data by time period (day, week, month)
 */
function groupSalesByPeriod(salesData: any[], groupBy: string) {
  const groups = new Map<string, {
    period: string;
    totalRevenue: number;
    totalInvoices: number;
    totalItems: number;
  }>();

  salesData.forEach(invoice => {
    const date = new Date(invoice.createdAt);
    let periodKey: string;

    switch (groupBy) {
      case 'day':
        periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        break;
      default:
        periodKey = date.toISOString().split('T')[0];
    }

    const existing = groups.get(periodKey) || {
      period: periodKey,
      totalRevenue: 0,
      totalInvoices: 0,
      totalItems: 0,
    };

    existing.totalRevenue += Number(invoice.totalAmount);
    existing.totalInvoices += 1;
    existing.totalItems += invoice.items.length;

    groups.set(periodKey, existing);
  });

  return Array.from(groups.values()).sort((a, b) => a.period.localeCompare(b.period));
}