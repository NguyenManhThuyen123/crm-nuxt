const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create a tenant first
    const tenant = await prisma.tenant.upsert({
      where: { name: 'Test Store' },
      update: {},
      create: {
        name: 'Test Store',
        address: '123 Test Street',
        contact: 'test@store.com'
      }
    });

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        username: 'admin',
        role: 'ADMIN'
      }
    });

    // Create seller user
    const sellerUser = await prisma.user.upsert({
      where: { email: 'seller@example.com' },
      update: {},
      create: {
        email: 'seller@example.com',
        password: await bcrypt.hash('seller123', 10),
        username: 'seller',
        role: 'SELLER',
        tenantId: tenant.id
      }
    });

    console.log('✅ Test users created successfully!');
    console.log('Admin:', { email: 'admin@example.com', password: 'admin123' });
    console.log('Seller:', { email: 'seller@example.com', password: 'seller123' });
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();