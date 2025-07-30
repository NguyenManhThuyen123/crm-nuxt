import { createTenantContext } from "~/server/utils/tenant-db";
import { createInventoryTransactionService } from "~/server/utils/inventory-transactions";

const BulkStockUpdateSchema = {
  updates: { required: true, type: 'array' },
  tenantId: { required: false, type: 'string' },
};

const StockUpdateItemSchema = {
  variantId: { required: true, type: 'number' },
  newStock: { required: true, type: 'number', min: 0 },
};

function validateBulkStockUpdateData(data: any) {
  const errors: string[] = [];
  
  if (!data.updates || !Array.isArray(data.updates)) {
    errors.push("updates must be an array");
    return errors;
  }
  
  if (data.updates.length === 0) {
    errors.push("updates array cannot be empty");
    return errors;
  }
  
  data.updates.forEach((update: any, index: number) => {
    for (const [field, rules] of Object.entries(StockUpdateItemSchema)) {
      const value = update[field];
      
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`updates[${index}].${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null) {
        if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
          errors.push(`updates[${index}].${field} must be a valid number`);
          continue;
        }
        
        if (rules.type === 'number' && typeof value === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`updates[${index}].${field} must be at least ${rules.min}`);
          }
        }
      }
    }
  });
  
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
    const validationErrors = validateBulkStockUpdateData(body);
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validationErrors.join(', ')}`,
      });
    }

    const context = createTenantContext(user);
    const inventoryService = createInventoryTransactionService(context);
    
    const result = await inventoryService.performBulkStockUpdate(
      body.updates.map((update: any) => ({
        variantId: parseInt(update.variantId),
        newStock: parseInt(update.newStock),
      })),
      body.tenantId
    );

    if (!result.success) {
      throw createError({
        statusCode: 422,
        message: result.errors?.join(', ') || "Bulk stock update failed",
      });
    }

    return {
      success: true,
      affectedVariants: result.affectedVariants,
      message: `Successfully updated stock for ${result.affectedVariants.length} variants`,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});