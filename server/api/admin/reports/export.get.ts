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

    // Only admins can export reports
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
    const reportType = query.type as string || 'sales'; // sales, products, inventory

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

    if (!['sales', 'products', 'inventory'].includes(reportType)) {
      throw createError({
        statusCode: 400,
        message: "Invalid report type. Must be 'sales', 'products', or 'inventory'",
      });
    }

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = endDate || new Date();
    const defaultStartDate = startDate || new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      let csvContent = '';
      let filename = '';

      switch (reportType) {
        case 'sales':
          const result = await generateSalesCSV(tenantId, defaultStartDate, defaultEndDate);
          csvContent = result.content;
          filename = result.filename;
          break;
        case 'products':
          const productResult = await generateProductsCSV(tenantId);
          csvContent = productResult.content;
          filename = productResult.filename;
          break;
        case 'inventory':
          const inventoryResult = await generateInventoryCSV(tenantId);
          csvContent = inventoryResult.content;
          filename = inventoryResult.filename;
          break;
      }

      // Set headers for CSV download
      setHeader(event, 'Content-Type', 'text/csv');
      setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
      
      return csvContent;
    } catch (error: any) {
      console.error("Report export error:", error);
      
      throw createError({
        statusCode: 500,
        message: "Failed to export report",
      });
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    console.error("Unexpected error in report export:", error);
    
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

/**
 * Generate sales report CSV
 */
async function generateSalesCSV(tenantId: string | undefined, startDate: Date, endDate: Date) {
  const whereClause: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

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

  // CSV headers
  const headers = [
    'Invoice ID',
    'Date',
    'Time',
    'Tenant',
    'Seller',
    'Product Name',
    'Category',
    'Barcode',
    'Weight',
    'Quantity',
    'Unit Price',
    'Line Total',
    'Invoice Total'
  ];

  let csvContent = headers.join(',') + '\n';

  // Add data rows
  salesData.forEach(invoice => {
    invoice.items.forEach(item => {
      const row = [
        invoice.id,
        invoice.createdAt.toISOString().split('T')[0], // Date
        invoice.createdAt.toISOString().split('T')[1].split('.')[0], // Time
        `"${invoice.tenant.name}"`,
        `"${invoice.user.username || invoice.user.email}"`,
        `"${item.variant.product.name}"`,
        `"${item.variant.product.category || ''}"`,
        item.variant.barcode,
        item.variant.weight,
        item.quantity,
        item.unitPrice,
        item.totalPrice,
        invoice.totalAmount
      ];
      csvContent += row.join(',') + '\n';
    });
  });

  const dateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  const tenantStr = tenantId ? `_${tenantId}` : '_all';
  const filename = `sales_report_${dateStr}_to_${endDateStr}${tenantStr}.csv`;

  return { content: csvContent, filename };
}

/**
 * Generate products report CSV
 */
async function generateProductsCSV(tenantId: string | undefined) {
  const whereClause: any = {};
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      variants: true,
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // CSV headers
  const headers = [
    'Product ID',
    'Product Name',
    'Description',
    'Category',
    'Tenant',
    'Variant ID',
    'Barcode',
    'Weight',
    'Price',
    'Stock',
    'Created Date'
  ];

  let csvContent = headers.join(',') + '\n';

  // Add data rows
  products.forEach(product => {
    product.variants.forEach(variant => {
      const row = [
        product.id,
        `"${product.name}"`,
        `"${product.description || ''}"`,
        `"${product.category || ''}"`,
        `"${product.tenant.name}"`,
        variant.id,
        variant.barcode,
        variant.weight,
        variant.price,
        variant.stock,
        product.createdAt.toISOString().split('T')[0]
      ];
      csvContent += row.join(',') + '\n';
    });
  });

  const tenantStr = tenantId ? `_${tenantId}` : '_all';
  const filename = `products_report${tenantStr}.csv`;

  return { content: csvContent, filename };
}

/**
 * Generate inventory report CSV
 */
async function generateInventoryCSV(tenantId: string | undefined) {
  const whereClause: any = {};
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  const variants = await prisma.productVariant.findMany({
    where: whereClause,
    include: {
      product: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      { product: { name: 'asc' } },
      { barcode: 'asc' },
    ],
  });

  // CSV headers
  const headers = [
    'Tenant',
    'Product Name',
    'Category',
    'Barcode',
    'Weight',
    'Price',
    'Current Stock',
    'Stock Status',
    'Last Updated'
  ];

  let csvContent = headers.join(',') + '\n';

  // Add data rows
  variants.forEach(variant => {
    const stockStatus = variant.stock <= 0 ? 'Out of Stock' : 
                       variant.stock <= 10 ? 'Low Stock' : 'In Stock';

    const row = [
      `"${variant.product.tenant.name}"`,
      `"${variant.product.name}"`,
      `"${variant.product.category || ''}"`,
      variant.barcode,
      variant.weight,
      variant.price,
      variant.stock,
      stockStatus,
      variant.updatedAt.toISOString().split('T')[0]
    ];
    csvContent += row.join(',') + '\n';
  });

  const tenantStr = tenantId ? `_${tenantId}` : '_all';
  const filename = `inventory_report${tenantStr}.csv`;

  return { content: csvContent, filename };
}