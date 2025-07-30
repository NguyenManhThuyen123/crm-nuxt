import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return { message: 'Admin user already exists', user: existingAdmin.email }
    }

    // Create default tenant if not exists
    const tenant = await prisma.tenant.upsert({
      where: { name: 'Default Store' },
      update: {},
      create: {
        name: 'Default Store',
        address: '123 Main Street',
        contact: 'admin@store.com'
      }
    })

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        username: 'admin',
        role: 'ADMIN'
      }
    })

    // Create seller user
    const sellerUser = await prisma.user.create({
      data: {
        email: 'seller@example.com',
        password: await bcrypt.hash('seller123', 10),
        username: 'seller',
        role: 'SELLER',
        tenantId: tenant.id
      }
    })

    return {
      message: 'Users created successfully',
      admin: { email: adminUser.email, password: 'admin123' },
      seller: { email: sellerUser.email, password: 'seller123' }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create users',
      message: error.message
    })
  }
})