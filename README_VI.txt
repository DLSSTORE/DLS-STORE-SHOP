DLS STORE - BẢN FULL CÓ SERVER

Vấn đề của bản HTML cũ:
- localStorage chỉ lưu trên trình duyệt của từng người.
- Vì vậy Admin đổi ảnh/sản phẩm trên máy Admin thì khách mở máy khác không thấy.
- Ảnh acc dạng base64/localStorage cũng dễ đầy bộ nhớ và gây lỗi lưu.

Bản này đã chuyển dữ liệu sang server:
- Tất cả khách truy cập dùng chung danh sách acc.
- Admin thêm/sửa/xóa acc -> dữ liệu được lưu trên server.
- Ảnh được upload vào thư mục uploads/ trên server.
- Ảnh hero cũng được lưu chung trên server.
- Đăng nhập Admin dùng cookie HttpOnly.
- Chỉ API Admin mới được phép sửa/xóa/upload.

CHẠY TRÊN MÁY TÍNH
1. Cài Node.js 18 trở lên.
2. Mở Terminal/CMD tại thư mục này.
3. Chạy: npm install
4. Chạy: npm start
5. Mở: http://localhost:3000

TÀI KHOẢN MẶC ĐỊNH
Username: caothangzzz
Password: Caothang9999@

KHUYẾN NGHỊ KHI ĐƯA LÊN INTERNET
- Đặt ADMIN_USERNAME và ADMIN_PASSWORD bằng biến môi trường trên hosting.
- Phải dùng hosting/server có ổ đĩa lưu trữ lâu dài cho thư mục data/ và uploads/.
- Nếu hosting xóa filesystem mỗi lần deploy/restart thì ảnh sẽ mất; cần Persistent Disk/Volume hoặc chuyển uploads/data sang dịch vụ lưu trữ/DB riêng.
- Không mở file public/index.html bằng cách bấm trực tiếp. Website phải chạy qua Node server.

CẤU TRÚC
server.js       API + đăng nhập + upload + lưu dữ liệu
public/         giao diện website
data/store.json  dữ liệu sản phẩm/ảnh hero
uploads/        ảnh Admin upload
package.json    dependency và lệnh chạy
