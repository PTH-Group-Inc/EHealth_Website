# E-Health — Hệ thống đặt lịch & quản lý khám chữa bệnh

## Mục tiêu
Xây dựng hệ thống gồm 3 giao diện:
1) Mobile App (Bệnh nhân): đặt lịch, xem hồ sơ, nhắc thuốc, chat AI
2) Web Portal (Bác sĩ/Dược sĩ/Lễ tân): tiếp nhận, khám bệnh, kê đơn, xuất thuốc
3) Web Admin (Quản trị): cấu hình hệ thống, nhân sự, báo cáo

## Công nghệ dự kiến
- Mobile: Flutter
- Web: React (Portal + Admin)
- Backend API: Node.js hoặc FastAPI
- CSDL: MySQL (dữ liệu cấu trúc) + MongoDB (log/hồ sơ text)
- AI: OpenAI API (ngôn ngữ) + thuật toán đơn giản (gợi ý slot, cảnh báo)

## Cách chạy dự án (sẽ cập nhật sau)
- ...

## Biến môi trường quan trọng
- ...

## Giả định
- ...

## Quyết định quan trọng
- ...

## Lộ trình
### Giai đoạn 2.1 — Nền tảng
- [ ] Thiết kế ERD: Users/Roles/Doctors/Departments/Medicines
- [ ] Admin: Quản lý Chuyên khoa
- [ ] Admin: Quản lý Bác sĩ + khung giờ làm việc
- [ ] Admin: Quản lý Thuốc (master data)
- [ ] Xác thực: đăng ký/đăng nhập/quên mật khẩu (OTP)

### Giai đoạn 2.2 — Đặt lịch & tiếp nhận
- [ ] App: tìm bác sĩ theo tên/chuyên khoa/triệu chứng
- [ ] App: đặt lịch theo slot trống + quản lý lịch (hủy/dời)
- [ ] Portal: duyệt lịch + check-in + hàng đợi (queue)

### Giai đoạn 2.3 — Khám bệnh & hồ sơ
- [ ] Portal: dashboard bác sĩ + khám bệnh (sinh hiệu/triệu chứng/chẩn đoán)
- [ ] Kê đơn điện tử + xuất thuốc
- [ ] Hồ sơ sức khỏe timeline cho bệnh nhân

### Giai đoạn 2.4 — AI
- [ ] Chat tư vấn ban đầu + gợi ý chuyên khoa
- [ ] Gợi ý slot đặt lịch thông minh
- [ ] Tóm tắt bệnh án
- [ ] Nhắc thuốc + tuân thủ điều trị + cảnh báo

### Giai đoạn 2.5 — Mở rộng
- [ ] Video call khám online
- [ ] Thanh toán (Momo/VNPay/QR)
- [ ] Báo cáo doanh thu/tần suất bệnh/hiệu suất bác sĩ

## Ghi chú kiểm thử
- ...
