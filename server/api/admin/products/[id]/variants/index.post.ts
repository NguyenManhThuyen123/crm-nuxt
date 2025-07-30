import { createTenantContext, TenantVariantService } from "~/server/utils/tenant-db";

const VariantCreateSchema = {
  barcode: { required: true, type: 'string', minLength: 1, maxLength: 100 },
  weight: { required: true, type: 'number', min: 0 },
  price: { required: true, type: 'number', min: 0 },
  stock: { required: true, type: 'number', min: 0 },
  tenantId: { required: true, type: 'string' },
};

function validateVariantData(data: any) {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(VariantCreateSchema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field} is required`);
      continue;
    }
    
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

    const productId = getRouterParam(event, 'id');
    if (!productId || isNaN(parseInt(productId))) {
      throw createError({
        statusCode: 400,
        message: "Invalid product ID",
      });
    }

    const body = await readBody(event);
    
    // Validate input data
    const validationErrors = validateVariantData(body);
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validationErrors.join(', ')}`,
      });
    }

    // Validate barcode format (basic validation)
    const barcodeRegex = /^[0-9A-Za-z\-_]+$/;
    if (!barcodeRegex.test(body.barcode)) {
      throw createError({
        statusCode: 400,
        message: "Barcode can only contain alphanumeric characters, hyphens, and underscores",
      });
    }

    const context = createTenantContext(user);
    const variantService = new TenantVariantService(context);

    try {
      const variant = await variantService.createVariant({
        barcode: body.barcode.trim(),
        weight: parseFloat(body.weight),
        price: parseFloat(body.price),
        stock: parseInt(body.stock),
        productId: parseInt(productId),
        tenantId: body.tenantId,
      });

      return variant;
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