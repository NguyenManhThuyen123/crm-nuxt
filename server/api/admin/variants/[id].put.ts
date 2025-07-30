import { createTenantContext, TenantVariantService } from "~/server/utils/tenant-db";
import { prisma } from "~/server/utils/db";

interface ValidationRule {
  required: boolean;
  type: 'string' | 'number';
  minLength?: number;
  maxLength?: number;
  min?: number;
}

const VariantUpdateSchema: Record<string, ValidationRule> = {
  barcode: { required: false, type: 'string', minLength: 1, maxLength: 100 },
  weight: { required: false, type: 'number', min: 0 },
  price: { required: false, type: 'number', min: 0 },
};

function validateVariantUpdateData(data: any) {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(VariantUpdateSchema)) {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
        continue;
      }
      
      if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
        errors.push(`${field} must be a valid number`);
        continue;
      }
      
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
      }
      
      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
      }
    }
  }
  
  return errors;
}

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const id = getRouterParam(event, 'id');
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        message: "Invalid variant ID",
      });
    }

    const body = await readBody(event);
    const query = getQuery(event);
    const tenantId = query.tenantId as string | undefined;
    
    // Validate input data
    const validationErrors = validateVariantUpdateData(body);
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validationErrors.join(', ')}`,
      });
    }

    // Validate barcode format if provided
    if (body.barcode) {
      const barcodeRegex = /^[0-9A-Za-z\-_]+$/;
      if (!barcodeRegex.test(body.barcode)) {
        throw createError({
          statusCode: 400,
          message: "Barcode can only contain alphanumeric characters, hyphens, and underscores",
        });
      }
    }

    const context = createTenantContext(user);
    
    // First verify the variant exists and user has access
    const whereClause: any = {
      id: parseInt(id),
    };
    
    if (context.role === 'SELLER' && context.tenantId) {
      whereClause.tenantId = context.tenantId;
    } else if (tenantId) {
      whereClause.tenantId = tenantId;
    }
    
    const variant = await prisma.productVariant.findFirst({
      where: whereClause,
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw createError({
        statusCode: 404,
        message: "Product variant not found or access denied",
      });
    }

    const updateData: any = {};
    if (body.barcode !== undefined) updateData.barcode = body.barcode.trim();
    if (body.weight !== undefined) updateData.weight = parseFloat(body.weight);
    if (body.price !== undefined) updateData.price = parseFloat(body.price);

    try {
      const updatedVariant = await prisma.productVariant.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          product: true,
        },
      });

      return updatedVariant;
    } catch (error: any) {
      // Handle unique constraint violation for barcode
      if (error.code === 'P2002' && error.meta?.target?.includes('barcode')) {
        throw createError({
          statusCode: 409,
          message: "Barcode already exists in the system",
        });
      }
      throw error;
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});