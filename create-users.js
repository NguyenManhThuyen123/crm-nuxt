const bcrypt = require('bcrypt');

async function createHashedPasswords() {
  const admin123 = await bcrypt.hash('admin123', 10);
  const seller123 = await bcrypt.hash('seller123', 10);
  
  console.log('Admin password hash:', admin123);
  console.log('Seller password hash:', seller123);
  
  console.log('\nSQL to create users:');
  console.log(`
-- Create admin user
INSERT INTO users (email, password, username, role, "createdAt", "updatedAt") 
VALUES ('admin@example.com', '${admin123}', 'admin', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  password = '${admin123}',
  username = 'admin',
  role = 'ADMIN';

-- Create seller user  
INSERT INTO users (email, password, username, role, "createdAt", "updatedAt") 
VALUES ('seller@example.com', '${seller123}', 'seller', 'SELLER', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  password = '${seller123}',
  username = 'seller',
  role = 'SELLER';
  `);
}

createHashedPasswords().catch(console.error);