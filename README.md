# CRM Nuxt

Hệ thống CRM đa tenant được xây dựng với Nuxt 3, Prisma, và PostgreSQL.

## Tính năng

- 🏢 Multi-tenant architecture
- 👥 Quản lý người dùng và phân quyền
- 📦 Quản lý sản phẩm và variants
- 📊 Quản lý kho hàng
- 🧾 Hệ thống hóa đơn
- 📱 Quét mã vạch
- 📈 Báo cáo và thống kê
- 🎨 UI hiện đại với Tailwind CSS

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, Tailwind CSS
- **Backend**: Nuxt API Routes
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: JWT
- **UI Components**: Headless UI, Shadcn/ui

## Yêu cầu hệ thống

- Node.js >= 20.0.0
- PostgreSQL
- npm hoặc yarn

## Cài đặt

### Development

1. Clone repository:
```bash
git clone https://github.com/hhane244/crm-nuxt.git
cd crm-nuxt
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env:
```bash
cp .env.example .env
```

4. Cấu hình database trong .env:
```
DATABASE_URL="postgresql://username:password@localhost:5432/crm_nuxt"
JWT_SECRET="your-secret-key"
```

5. Chạy migrations:
```bash
npx prisma migrate dev
```

6. Seed database (optional):
```bash
npx prisma db seed
```

7. Khởi động development server:
```bash
npm run dev
```

### Production với Docker

1. Build và chạy với Docker Compose:
```bash
docker-compose up --build
```

2. Truy cập ứng dụng tại: http://localhost:3000

## Deploy lên Render.com

1. Push code lên GitHub
2. Tạo Web Service mới trên Render.com
3. Connect với GitHub repository
4. Sử dụng cấu hình:
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `node .output/server/index.mjs`
   - **Environment**: Node.js

5. Tạo PostgreSQL database trên Render
6. Cấu hình environment variables:
   - `DATABASE_URL`: Connection string từ Render PostgreSQL
   - `JWT_SECRET`: Random secret key
   - `NODE_ENV`: production

## Scripts

- `npm run dev` - Khởi động development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run db:migrate` - Chạy database migrations
- `npm run db:reset` - Reset database
- `npm run prisma:studio` - Mở Prisma Studio

## Cấu trúc thư mục

```
├── components/          # Vue components
├── pages/              # Nuxt pages (routes)
├── server/             # API routes
├── prisma/             # Database schema và migrations
├── assets/             # Static assets
├── public/             # Public files
├── middleware/         # Route middleware
├── composables/        # Vue composables
└── utils/              # Utility functions
```

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.