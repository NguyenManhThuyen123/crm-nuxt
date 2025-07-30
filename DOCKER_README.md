# Docker Setup cho CRM Nuxt

## Yêu cầu
- Docker
- Docker Compose

## Cách chạy

### 1. Build và chạy với Docker Compose
```bash
# Build và chạy tất cả services
docker-compose up --build

# Chạy ở background
docker-compose up -d --build
```

### 2. Chỉ build Docker image
```bash
docker build -t crm-nuxt .
```

### 3. Chạy container riêng lẻ
```bash
# Chạy database trước
docker run -d --name postgres-db \
  -e POSTGRES_DB=crm_nuxt \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# Chạy ứng dụng
docker run -d --name crm-app \
  -e DATABASE_URL=postgresql://postgres:password@postgres-db:5432/crm_nuxt \
  -p 3000:3000 \
  --link postgres-db \
  crm-nuxt
```

## Truy cập ứng dụng
- Ứng dụng: http://localhost:3000
- Database: localhost:5432

## Dừng services
```bash
docker-compose down

# Xóa volumes (dữ liệu database sẽ bị mất)
docker-compose down -v
```

## Logs
```bash
# Xem logs của tất cả services
docker-compose logs

# Xem logs của service cụ thể
docker-compose logs app
docker-compose logs db
```

## Troubleshooting

### Lỗi build
- Đảm bảo Node.js version >= 20
- Xóa node_modules và .output trước khi build
- Kiểm tra .dockerignore

### Lỗi database connection
- Đảm bảo DATABASE_URL đúng format
- Kiểm tra database đã khởi động chưa
- Xem logs: `docker-compose logs db`

### Lỗi Prisma
- Chạy migration: `docker-compose exec app npx prisma migrate deploy`
- Generate client: `docker-compose exec app npx prisma generate`