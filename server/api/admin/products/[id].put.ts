import { createTenantContext, TenantProductService } from "~/server/utils/tenant-db";

const ProductUpdateSchema = {
  name: { required: false, type: 'string', minLength: 1, maxLength: 255 },
  description: { required: false, type: 'string', maxLength: 1000 },
  category: { required: false, type: 'string', maxLength: 100 },
};

function validateProductUpdateData(data: any) {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(ProductUpdateSchema)) {
    const value = data[field];
    
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

    const id = getRouterParam(event, 'id');
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        message: "Invalid product ID",
      });
    }

    const body = await readBody(event);
    const query = getQuery(event);
    const tenantId = query.tenantId as string | undefined;
    
    // Validate input data
    const validationErrors = validateProductUpdateData(body);
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validationErrors.join(', ')}`,
      });
    }

    const context = createTenantContext(user);
    const productService = new TenantProductService(context);

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim();
    if (body.category !== undefined) updateData.category = body.category?.trim();

    const product = await productService.updateProduct(parseInt(id), updateData, tenantId);

    return product;
  } catch (error: any) {
    if (error.message === "Product not found or access denied") {
      throw createError({
        statusCode: 404,
        message: "Product not found",
      });
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});