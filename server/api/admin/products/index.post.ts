import { createTenantContext, TenantProductService } from "~/server/utils/tenant-db";

const ProductCreateSchema = {
  name: { required: true, type: 'string', minLength: 1, maxLength: 255 },
  description: { required: false, type: 'string', maxLength: 1000 },
  category: { required: false, type: 'string', maxLength: 100 },
  tenantId: { required: true, type: 'string' },
};

function validateProductData(data: any) {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(ProductCreateSchema)) {
    const value = data[field];
    
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
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

    const body = await readBody(event);
    
    // Validate input data
    const validationErrors = validateProductData(body);
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validationErrors.join(', ')}`,
      });
    }

    const context = createTenantContext(user);
    const productService = new TenantProductService(context);

    const product = await productService.createProduct({
      name: body.name.trim(),
      description: body.description?.trim(),
      category: body.category?.trim(),
      tenantId: body.tenantId,
    });

    return product;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});