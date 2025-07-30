# Database Setup Guide

This guide explains how to set up the PostgreSQL database for the multi-tenant inventory management system.

## Prerequisites

1. **PostgreSQL Installation**
   - Install PostgreSQL from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   - Ensure PostgreSQL service is running
   - Note your PostgreSQL username and password

2. **Database Creation**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create the database
   CREATE DATABASE inventory_db;
   
   # Exit psql
   \q
   ```

## Environment Configuration

1. **Update .env file**
   ```bash
   # Copy from example
   cp .env.example .env
   
   # Update DATABASE_URL with your PostgreSQL credentials
   DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db?schema=public"
   ```

   Replace:
   - `username` with your PostgreSQL username (usually `postgres`)
   - `password` with your PostgreSQL password
   - `localhost:5432` with your PostgreSQL host and port if different
   - `inventory_db` with your database name if different

## Database Setup

### Option 1: Automated Setup (Recommended)
```bash
npm run db:setup
```

This script will:
- Check PostgreSQL availability
- Validate environment configuration
- Generate Prisma client
- Run database migrations
- Provide next steps

### Option 2: Manual Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run db:migrate

# Seed the database (optional)
npm run prisma:seed
```

## Database Schema

The multi-tenant inventory system includes the following entities:

### Core Entities
- **Tenant**: Stores (retail locations)
- **User**: System users with roles (ADMIN/SELLER)
- **Product**: Product catalog items
- **ProductVariant**: Product variations with barcodes
- **Invoice**: Sales transactions
- **InvoiceItem**: Invoice line items

### Legacy Entities (CRM)
- **Contact**: Customer contacts
- **Notes**: Contact notes

### Key Features
- **Multi-tenancy**: Data isolation by tenant
- **Role-based access**: Admin (cross-tenant) vs Seller (single tenant)
- **Barcode system**: Unique barcodes for product variants
- **Inventory tracking**: Stock levels and transactions
- **Performance indexes**: Optimized for common queries

## Verification

After setup, verify the database:

```bash
# Open Prisma Studio to browse data
npm run prisma:studio

# Check database connection
npx prisma db pull
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL credentials
- Check firewall settings
- Confirm database exists

### Migration Issues
- Reset database: `npm run db:reset`
- Check Prisma schema syntax
- Verify foreign key constraints

### Seed Issues
- Ensure migrations are applied first
- Check for unique constraint violations
- Verify tenant relationships

## Development Workflow

1. **Schema Changes**
   ```bash
   # After modifying prisma/schema.prisma
   npm run db:migrate
   npm run prisma:generate
   ```

2. **Reset Database**
   ```bash
   # Completely reset and reseed
   npm run db:reset
   npm run prisma:seed
   ```

3. **View Data**
   ```bash
   # Open Prisma Studio
   npm run prisma:studio
   ```

## Production Considerations

- Use connection pooling
- Set up database backups
- Configure proper indexes
- Monitor query performance
- Implement database monitoring
- Use environment-specific databases