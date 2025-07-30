import { faker } from "@faker-js/faker";
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
const prisma = new PrismaClient();

const main = async () => {
  // delete all data in correct order (respecting foreign key constraints)
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notes.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: "Default Store",
      address: "123 Main St, City, State 12345",
      contact: "store@example.com",
    },
  });

  // Create additional tenant for testing
  const testTenant = await prisma.tenant.create({
    data: {
      name: "Test Store",
      address: "456 Oak Ave, Another City, State 67890",
      contact: "test@example.com",
    },
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      username: "admin",
      role: UserRole.ADMIN,
      // Admin users don't need to be assigned to a specific tenant
    },
  });

  // Create seller user for default tenant
  const sellerUser = await prisma.user.create({
    data: {
      email: "seller@example.com",
      password: await bcrypt.hash("seller123", 10),
      username: "seller",
      role: UserRole.SELLER,
      tenantId: defaultTenant.id,
    },
  });

  // Create original user (for backward compatibility)
  const user = await prisma.user.create({
    data: {
      email: "johndoe@gmail.com",
      password: await bcrypt.hash("123456789", 10),
      username: "johndoe",
      role: UserRole.SELLER,
      tenantId: defaultTenant.id,
    },
  });

  // Create 100 contacts with faker (for backward compatibility)
  for (let i = 0; i < 100; i++) {
    await prisma.contact.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        company: faker.company.name(),
        department: faker.commerce.department(),
        position: faker.person.jobTitle(),
        userId: user.id,
        notes: {
          create: {
            content: faker.lorem.paragraphs(4),
          },
        },
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}, ${faker.location.zipCode()}, ${faker.location.country()}`,
      },
    });
  }

  // Create sample products for default tenant
  const categories = ["Electronics", "Clothing", "Food", "Books", "Home"];

  for (let i = 0; i < 20; i++) {
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: faker.helpers.arrayElement(categories),
        tenantId: defaultTenant.id,
      },
    });

    // Create 1-3 variants per product
    const variantCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < variantCount; j++) {
      await prisma.productVariant.create({
        data: {
          barcode: faker.string.numeric(13), // Generate 13-digit barcode
          weight: faker.number.float({ min: 0.1, max: 10, fractionDigits: 2 }),
          price: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
          stock: faker.number.int({ min: 0, max: 100 }),
          productId: product.id,
          tenantId: defaultTenant.id,
        },
      });
    }
  }

  // Create sample products for test tenant
  for (let i = 0; i < 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: faker.helpers.arrayElement(categories),
        tenantId: testTenant.id,
      },
    });

    // Create 1-2 variants per product
    const variantCount = faker.number.int({ min: 1, max: 2 });
    for (let j = 0; j < variantCount; j++) {
      await prisma.productVariant.create({
        data: {
          barcode: faker.string.numeric(13),
          weight: faker.number.float({ min: 0.1, max: 10, fractionDigits: 2 }),
          price: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
          stock: faker.number.int({ min: 0, max: 50 }),
          productId: product.id,
          tenantId: testTenant.id,
        },
      });
    }
  }

  console.log("✅ Database seeded successfully!");
  console.log(`📊 Created:`);
  console.log(`   - 2 tenants`);
  console.log(`   - 3 users (1 admin, 2 sellers)`);
  console.log(`   - 100 contacts`);
  console.log(`   - 30 products with variants`);
};

// Call main function
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
