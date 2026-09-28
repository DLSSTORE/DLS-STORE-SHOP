# DLS Store — GitHub Ready

Website bán tài khoản DLS với giao diện mobile-first, trang quản trị và upload ảnh dùng chung qua server.

## Quan trọng
GitHub chỉ lưu mã nguồn. **GitHub Pages không chạy được `server.js`**. Website cần được deploy lên một nền tảng chạy Node.js (Render, Railway, VPS, etc.).

## 1. Chạy trên máy

```bash
npm install
cp .env.example .env
npm start
```

Mở `http://localhost:3000`.

Trên Windows PowerShell:

```powershell
copy .env.example .env
npm install
npm start
```

## 2. Cấu hình Admin

Không đưa mật khẩu thật lên GitHub. Đặt trong biến môi trường của hosting:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `COOKIE_SECURE=true` khi website chạy HTTPS

## 3. Deploy bằng Render

Repository có sẵn `render.yaml`.

1. Push toàn bộ thư mục này lên GitHub.
2. Trong Render chọn **New → Blueprint**.
3. Chọn repository.
4. Đặt `ADMIN_USERNAME` và `ADMIN_PASSWORD` trong Environment Variables.
5. Deploy.

### Lưu ý về ảnh và dữ liệu
Phiên bản này lưu dữ liệu vào `data/store.json` và ảnh vào `uploads/`. Đây là mô hình đơn giản, phù hợp cho một server đơn lẻ. Nếu hosting dùng filesystem tạm thời hoặc tự động thay instance, dữ liệu/ảnh có thể mất sau redeploy/restart. Khi website hoạt động lâu dài nên chuyển ảnh sang object storage (Cloudinary/S3/R2/Supabase Storage) và dữ liệu sang database (PostgreSQL/Supabase).

## 4. Chức năng

- Admin đăng nhập bằng cookie HttpOnly.
- Khách chỉ đọc dữ liệu từ `/api/store`.
- Admin upload ảnh hero.
- Admin đăng/sửa/xóa tài khoản DLS.
- Nhiều ảnh cho mỗi tài khoản.
- Chọn ảnh chính.
- Đổi trạng thái còn hàng/đã bán.
- Dữ liệu dùng chung cho mọi khách truy cập cùng server.
- Giao diện responsive cho điện thoại.

## 5. Cấu trúc

```text
DLS_STORE_FULL/
├── public/index.html
├── server.js
├── package.json
├── Dockerfile
├── render.yaml
├── .env.example
├── .gitignore
├── README.md
├── data/
│   └── store.json
└── uploads/
    └── .gitkeep
```
