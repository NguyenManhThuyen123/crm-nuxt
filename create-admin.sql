-- Create a tenant first
INSERT INTO tenants (id, name, address, contact, "createdAt", "updatedAt") 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Admin Store', '123 Admin St', 'admin@store.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create admin user (password is 'admin123' hashed with bcrypt)
INSERT INTO users (email, password, username, role, "tenantId", "createdAt", "updatedAt") 
VALUES ('admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ADMIN', NULL, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  username = 'admin',
  role = 'ADMIN';

-- Create seller user (password is 'seller123' hashed with bcrypt)  
INSERT INTO users (email, password, username, role, "tenantId", "createdAt", "updatedAt") 
VALUES ('seller@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', 'SELLER', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  username = 'seller',
  role = 'SELLER',
  "tenantId" = '550e8400-e29b-41d4-a716-446655440000';