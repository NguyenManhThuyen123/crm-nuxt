const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Delete all data in correct order
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notes.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: "Default Store",
      address: "123 Main St, City, State 12345",
      contact: "store@example.com",
    },
  });

  console.log('🏪 Created default tenant');

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      username: "admin",
      role: "ADMIN",
    },
  });

  // Create seller user
  const sellerUser = await prisma.user.create({
    data: {
      email: "seller@example.com",
      password: await bcrypt.hash("seller123", 10),
      username: "seller",
      role: "SELLER",
      tenantId: defaultTenant.id,
    },
  });

  console.log('👥 Created users');

  // Create sample product
  const product = await prisma.product.create({
    data: {
      name: "Sample Product",
      description: "A sample product for testing",
      category: "Electronics",
      tenantId: defaultTenant.id,
    },
  });

  // Create product variant
  const variant = await prisma.productVariant.create({
    data: {
      barcode: "1234567890123",
      weight: 1.5,
      price: 29.99,
      stock: 100,
      productId: product.id,
      tenantId: defaultTenant.id,
    },
  });

  console.log('📦 Created sample products');

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log('   - 1 tenant');
  console.log('   - 2 users (1 admin, 1 seller)');
  console.log('   - 1 product with variant');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });