<div align="center">

# 🏥 EHealth Website — Frontend

### Nền tảng Quản lý Y tế Số Đa Vai Trò

**Tác giả:** Nguyễn Minh Quân &nbsp;•&nbsp; Phan Thanh Hải &nbsp;|&nbsp; **Đồ án Tốt nghiệp**

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

<br/>

🔗 **Live Demo:** [https://dev.thanhhaishopwebsite.id.vn](https://dev.thanhhaishopwebsite.id.vn)

[Tổng quan](#-tổng-quan) · [Vai trò](#-vai-trò-hệ-thống) · [Tính năng](#-tính-năng-chi-tiết) · [Tech Stack](#-tech-stack) · [Cài đặt](#-getting-started) · [Jenkins CI/CD](#-triển-khai-jenkinscicd) · [English](#ehealth-website--frontend-english)

</div>

---

## 📋 Tổng quan

**EHealth Website** là giao diện web frontend của Hệ thống Quản lý Y tế Số toàn diện. Được xây dựng trên **Next.js 14 (App Router)** và **TypeScript**, hệ thống cung cấp **6 portal riêng biệt** cho từng vai trò: Quản trị viên, Bác sĩ, Dược sĩ, Lễ tân, Thu ngân, và Bệnh nhân — mỗi portal có dashboard, sidebar, layout riêng.

### Điểm nổi bật

- 🎨 **Giao diện hiện đại** — Glassmorphism login, dark mode, micro-animations (Framer Motion)
- 🤖 **AI Copilot** — Trợ lý AI tích hợp với command palette, voice input, context-aware suggestions
- 🌐 **Đa ngôn ngữ (i18n)** — Hỗ trợ Tiếng Việt, English, 中文 (next-intl)
- 📱 **Responsive Design** — Tương thích mọi kích thước màn hình
- 🔐 **Route Guards** — Bảo vệ route theo role, redirect tự động
- 🔔 **Real-time Notifications** — Notification bell, inbox modal, toast notifications
- 💬 **Floating ChatBox** — Chat hỗ trợ nổi trên mọi trang
- 📊 **40+ trang Admin** — Dashboard quản trị toàn diện
- 🩺 **21+ trang Bác sĩ** — Workflow khám bệnh hoàn chỉnh
- 💊 **10+ trang Dược sĩ** — Quản lý kho và phát thuốc
- 🏥 **13+ trang Lễ tân** — Tiếp nhận và điều phối bệnh nhân
- 🏦 **Cổng thanh toán** — QR Code, SePay, thanh toán offline
- 🧪 **Testing** — Vitest + React Testing Library + Playwright

---

## 👥 Vai trò Hệ thống

| Vai trò | Portal | Số trang | Mô tả |
|---------|--------|----------|-------|
| 🛡️ **Quản trị viên** | `/admin` | 40+ | Quản lý hệ thống, người dùng, phân quyền, master data, cấu hình, thống kê |
| 🩺 **Bác sĩ** | `/portal/doctor` | 21+ | Hàng đợi bệnh nhân, khám bệnh, chẩn đoán, kê đơn, y lệnh, EHR, telemedicine |
| 💊 **Dược sĩ** | `/portal/pharmacist` | 10+ | Phát thuốc, kiểm kho, master data dược, cảnh báo tồn kho |
| 🏥 **Lễ tân** | `/portal/receptionist` | 13+ | Tiếp nhận bệnh nhân, đặt lịch, check-in, quản lý hàng đợi, thanh toán |
| 💰 **Thu ngân** | `/portal/cashier` | — | Thanh toán offline, xác thực ca thu ngân |
| 👤 **Bệnh nhân** | `/patient` | 9+ | Đặt lịch khám, xem hồ sơ sức khỏe, bệnh án, thanh toán, telemedicine |
| 🌐 **Công khai** | `/` | 5+ | Landing page, tra cứu bác sĩ, chuyên khoa, đặt lịch, thanh toán |

---

## ✨ Tính năng Chi tiết

### 🛡️ Admin Portal — `/admin`

<details>
<summary><b>Xem danh sách đầy đủ (40+ trang)</b></summary>

| Module | Trang | Mô tả |
|--------|-------|-------|
| **Dashboard** | `/admin` | Tổng quan thống kê, biểu đồ hoạt động |
| **Người dùng** | `/admin/users` | Quản lý tài khoản, phân role, import/export Excel |
| **Bác sĩ** | `/admin/doctors` | Quản lý hồ sơ bác sĩ, chuyên khoa |
| **Phân quyền** | `/admin/permissions` | RBAC, API permission, menu permission |
| **Master Data** | `/admin/master-data` | Danh mục dùng chung (ICD-10, đơn vị đo, ...) |
| **Dược phẩm** | `/admin/pharmacy` | Danh mục thuốc, nhóm thuốc |
| **Thuốc** | `/admin/medicines` | Quản lý kho thuốc |
| **Kho** | `/admin/warehouses` | Quản lý kho vật tư |
| **Nhà cung cấp** | `/admin/suppliers` | Danh sách nhà cung cấp |
| **Chi nhánh** | `/admin/branches` | Quản lý mạng lưới chi nhánh |
| **Bệnh viện** | `/admin/hospitals` | Quản lý cơ sở y tế |
| **Cơ sở** | `/admin/facilities` | Trạng thái cơ sở |
| **Khoa phòng** | `/admin/departments` | Quản lý khoa/phòng ban |
| **Chuyên khoa** | `/admin/specialties` | Danh mục chuyên khoa |
| **Dịch vụ y tế** | `/admin/services` | Danh mục dịch vụ |
| **Phòng khám** | `/admin/clinic-rooms` | Quản lý phòng khám |
| **Giường bệnh** | `/admin/beds` | Quản lý giường nội trú |
| **Thiết bị** | `/admin/equipment` | Quản lý thiết bị y tế |
| **Ca trực** | `/admin/shifts` | Quản lý ca trực |
| **Lịch nhân viên** | `/admin/schedules` | Xếp lịch nhân viên |
| **Staff Schedule** | `/admin/staff-schedule` | Lịch biểu chi tiết |
| **Giờ hoạt động** | `/admin/operating-hours` | Giờ mở cửa cơ sở |
| **Đổi ca** | `/admin/shift-swaps` | Yêu cầu đổi ca |
| **Nghỉ phép** | `/admin/leaves` | Đơn nghỉ phép nhân viên |
| **Slot đặt lịch** | `/admin/slots` | Quản lý slot đặt khám |
| **Khả dụng BS** | `/admin/doctor-availability` | Lịch khả dụng bác sĩ |
| **Tải bác sĩ** | `/admin/doctor-load` | Phân tải khám bệnh |
| **Lịch sử thay đổi** | `/admin/appointment-changes` | Log thay đổi lịch khám |
| **Hóa đơn** | `/admin/billing-invoices` | Quản lý hóa đơn viện phí |
| **E-Invoice** | `/admin/e-invoices` | Hóa đơn điện tử |
| **Chính sách giá** | `/admin/pricing-policies` | Quản lý bảng giá |
| **Payment Gateway** | `/admin/payment-gateway` | Cấu hình cổng thanh toán |
| **Hoàn tiền** | `/admin/refunds` | Xử lý hoàn tiền |
| **Đối soát** | `/admin/reconciliation` | Đối soát tài chính |
| **Khuyến mãi** | `/admin/promotions` | Chương trình khuyến mãi |
| **Teleconsultation** | `/admin/teleconsultation` | Cấu hình telemedicine |
| **Thông báo** | `/admin/notifications` | Quản lý thông báo hệ thống |
| **Nhật ký** | `/admin/activity-logs` | Audit trail |
| **Thống kê** | `/admin/statistics` | Báo cáo & biểu đồ |
| **Cài đặt** | `/admin/settings` | Cấu hình hệ thống |

</details>

### 🩺 Doctor Portal — `/portal/doctor`

<details>
<summary><b>Xem danh sách đầy đủ (21+ trang)</b></summary>

| Trang | Mô tả |
|-------|-------|
| **Dashboard** | Tổng quan lịch khám, bệnh nhân chờ |
| **Hàng đợi** | Quản lý queue bệnh nhân real-time |
| **Lịch hẹn** | Xem/quản lý lịch khám cá nhân |
| **Bệnh nhân** | Danh sách bệnh nhân đang điều trị |
| **Khám bệnh** | Quy trình khám lâm sàng |
| **Khám CLS** | Khám cận lâm sàng |
| **Encounters** | Quản lý lượt khám |
| **Bệnh án** | Bệnh án điện tử (EMR) |
| **Chẩn đoán** | Chẩn đoán ICD-10 |
| **Kê đơn** | Kê đơn thuốc điện tử |
| **Y lệnh** | Medical orders (xét nghiệm, CDHA) |
| **Ký bệnh án** | Sign-off / phê duyệt bệnh án |
| **Kế hoạch điều trị** | Treatment plans |
| **EHR** | Hồ sơ sức khỏe điện tử |
| **Telemedicine** | Khám từ xa |
| **AI Assistant** | Trợ lý AI hỗ trợ chẩn đoán |
| **Cảnh báo** | Cảnh báo y tế |
| **Lịch trực** | Schedule cá nhân |
| **Đổi ca** | Yêu cầu đổi ca |
| **Nghỉ phép** | Đăng ký nghỉ phép |
| **Cài đặt** | Tùy chỉnh cá nhân |

</details>

### 💊 Pharmacist Portal — `/portal/pharmacist`

<details>
<summary><b>Xem danh sách đầy đủ (10+ trang)</b></summary>

| Trang | Mô tả |
|-------|-------|
| **Dashboard** | Tổng quan hoạt động nhà thuốc |
| **Đơn thuốc** | Danh sách đơn thuốc cần phát |
| **Phát thuốc** | Quy trình dispensing |
| **Tồn kho** | Kiểm tra tồn kho real-time |
| **Xuất kho** | Xuất thuốc theo đơn/yêu cầu |
| **Bệnh nhân** | Hồ sơ dùng thuốc bệnh nhân |
| **Medication Profile** | Lịch sử dùng thuốc |
| **Master Data** | Danh mục dược phẩm |
| **Cảnh báo** | Cảnh báo hết hàng, hết hạn |
| **Lịch sử** | Lịch sử phát thuốc cá nhân |
| **Cài đặt** | Tùy chỉnh giao diện |

</details>

### 🏥 Receptionist Portal — `/portal/receptionist`

<details>
<summary><b>Xem danh sách đầy đủ (13+ trang)</b></summary>

| Trang | Mô tả |
|-------|-------|
| **Dashboard** | Tổng quan tiếp nhận |
| **Lịch hẹn** | Quản lý lịch khám |
| **Tiếp nhận** | Đăng ký bệnh nhân mới/cũ |
| **Check-in** | Xác nhận đến khám |
| **Hàng đợi** | Quản lý queue tiếp nhận |
| **Bệnh nhân** | Tra cứu hồ sơ bệnh nhân |
| **Thanh toán** | Thu viện phí tại quầy |
| **Hóa đơn** | Quản lý hóa đơn |
| **Hoàn tiền** | Xử lý hoàn tiền |
| **Trạng thái phòng** | Theo dõi phòng khám |
| **Lịch sử thay đổi** | Change history |
| **Dữ liệu hỗ trợ** | Support data lookup |
| **Cài đặt** | Tùy chỉnh cá nhân |
| **Thông tin nhân viên** | Hồ sơ cá nhân |

</details>

### 👤 Patient Portal — `/patient`

<details>
<summary><b>Xem danh sách đầy đủ (9+ trang)</b></summary>

| Trang | Mô tả |
|-------|-------|
| **Dashboard** | Tổng quan sức khỏe cá nhân |
| **Lịch khám** | Xem/đặt lịch khám |
| **Bệnh án** | Xem bệnh án điện tử |
| **Hồ sơ sức khỏe** | EHR cá nhân |
| **Thanh toán** | Thanh toán viện phí online |
| **Hồ sơ cá nhân** | Quản lý thông tin cá nhân |
| **Nhắc thuốc** | Medication reminders |
| **Telemedicine** | Khám từ xa |
| **Tư vấn AI** | Hỏi đáp AI sức khỏe |

</details>

### 🌐 Public Pages

| Trang | Route | Mô tả |
|-------|-------|-------|
| **Landing Page** | `/` | Giới thiệu hệ thống, CTA đặt lịch |
| **Tra cứu Bác sĩ** | `/doctors` | Tìm kiếm bác sĩ theo chuyên khoa |
| **Chuyên khoa** | `/specialties` | Danh sách chuyên khoa |
| **Đặt lịch** | `/booking` | Đặt lịch khám online |
| **Thanh toán** | `/payment` | Thanh toán QR Code |

---

## 🤖 AI Copilot System

Hệ thống tích hợp **AI Copilot** — trợ lý thông minh hỗ trợ người dùng mọi vai trò:

| Component | Mô tả |
|-----------|-------|
| **Command Palette** | Ctrl+K mở nhanh, tìm kiếm & điều hướng |
| **AI Search Bar** | Tìm kiếm thông minh với context-aware |
| **Copilot Sidebar** | Panel chat AI bên phải màn hình |
| **Voice Input** | Nhập liệu bằng giọng nói |
| **Proactive Notifications** | AI gợi ý hành động chủ động |
| **Role Page Suggestions** | Gợi ý trang phù hợp theo vai trò |
| **Gamification Badge** | Badge thành tích sử dụng AI |
| **Weekly Summary** | Tóm tắt hoạt động tuần |
| **Context Banner** | Hiển thị context hiện tại cho AI |
| **Onboarding Modal** | Hướng dẫn sử dụng AI lần đầu |

---

## 🛠 Tech Stack

| Hạng mục | Công nghệ |
|----------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Components) |
| **Ngôn ngữ** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI Library** | [React 18](https://react.dev/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) + CSS Variables (Dark Mode) |
| **Animation** | [Framer Motion 12](https://www.framer.com/motion/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **i18n** | [next-intl 4](https://next-intl-docs.vercel.app/) (VI, EN, ZH-CN) |
| **Icons** | Google Material Symbols |
| **Typography** | Inter, Noto Sans SC (Google Fonts) |
| **Toast** | react-hot-toast |
| **QR Code** | react-qr-code |
| **Testing** | Vitest 4 + React Testing Library + Playwright |
| **Linting** | ESLint + next lint |
| **Type Safety** | TypeScript strict mode |
| **CI/CD** | Jenkins Pipeline |
| **Node.js** | v22.x (`.nvmrc` enforced) |

### Nguyên tắc Thiết kế

- **Constants-Driven** — Không hard-code routes, roles, statuses, colors, API endpoints. Tất cả nằm trong `src/constants/`
- **Feature-Based Modules** — Mỗi domain (users, appointments, prescriptions) có components riêng
- **Service Layer Pattern** — Toàn bộ API calls trừu tượng hóa qua `src/services/` (83+ service files)
- **Layout Composition** — Mỗi role có layout, sidebar, header riêng
- **Context Providers** — AuthContext, ToastContext, SidebarContext, AICopilotContext

---

## 🏗 Kiến trúc Dự án

```
src/
├── api/                          # API endpoint definitions
├── app/                          # Pages (Next.js App Router)
│   ├── (public)/                 # Public pages (landing, doctors, booking)
│   │   ├── landing/              # Landing page
│   │   ├── doctors/              # Doctor search
│   │   ├── specialties/          # Specialty listing
│   │   ├── booking/              # Online booking
│   │   └── payment/              # QR payment
│   ├── login/                    # Login page (glassmorphism)
│   ├── register/                 # Registration
│   ├── forgot-password/          # Password recovery
│   ├── otp/                      # OTP verification
│   ├── verify-email/             # Email verification
│   ├── admin/                    # 🛡️ Admin portal (40+ pages)
│   │   ├── users/
│   │   ├── doctors/
│   │   ├── departments/
│   │   ├── medicines/
│   │   ├── billing-invoices/
│   │   ├── statistics/
│   │   ├── settings/
│   │   └── ... (40+ subdirectories)
│   ├── portal/
│   │   ├── doctor/               # 🩺 Doctor portal (21+ pages)
│   │   │   ├── queue/
│   │   │   ├── examination/
│   │   │   ├── prescriptions/
│   │   │   ├── medical-records/
│   │   │   ├── ehr/
│   │   │   ├── telemedicine/
│   │   │   ├── ai-assistant/
│   │   │   └── ...
│   │   ├── pharmacist/           # 💊 Pharmacist portal (10+ pages)
│   │   │   ├── prescriptions/
│   │   │   ├── dispensing/
│   │   │   ├── inventory/
│   │   │   └── ...
│   │   ├── receptionist/         # 🏥 Receptionist portal (13+ pages)
│   │   │   ├── appointments/
│   │   │   ├── check-in/
│   │   │   ├── queue/
│   │   │   ├── billing/
│   │   │   └── ...
│   │   └── cashier/              # 💰 Cashier portal
│   │       └── offline/
│   ├── patient/                  # 👤 Patient portal (9+ pages)
│   │   ├── appointments/
│   │   ├── medical-records/
│   │   ├── health-records/
│   │   ├── billing/
│   │   ├── telemedicine/
│   │   └── ai-consult/
│   └── notifications/            # Notification center
├── components/
│   ├── admin/                    # Admin-specific components
│   ├── ai-copilot/               # 🤖 AI Copilot (17 components)
│   │   ├── CommandPalette.tsx
│   │   ├── AICopilotSidebar.tsx
│   │   ├── AISearchBar.tsx
│   │   ├── AIVoiceInputButton.tsx
│   │   └── ...
│   ├── common/                   # Shared reusable components
│   ├── patient/                  # Patient-specific components
│   ├── portal/                   # Portal-shared components
│   ├── shared/                   # Layouts, headers, sidebars (per role)
│   │   ├── admin-sidebar.tsx
│   │   ├── doctor-sidebar.tsx
│   │   ├── pharmacist-sidebar.tsx
│   │   ├── receptionist-sidebar.tsx
│   │   ├── patient-sidebar.tsx
│   │   ├── FloatingChatBox.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── ProfileCard.tsx
│   │   └── ...
│   └── ui/                       # UI primitives (Modal, Select, Dropdown)
├── config/                       # App configuration
├── constants/                    # Routes, roles, status enums, colors, API paths
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx            # Authentication state
│   ├── ToastContext.tsx           # Toast notification system
│   ├── SidebarContext.tsx         # Sidebar state
│   └── AICopilotContext.tsx       # AI Copilot state
├── data/                         # Static data
├── features/                     # Feature-based modules
│   ├── admin/
│   ├── appointments/
│   ├── departments/
│   ├── doctors/
│   ├── emr/
│   ├── medicines/
│   ├── notifications/
│   ├── patients/
│   ├── prescriptions/
│   ├── schedules/
│   └── users/
├── hooks/                        # Custom React hooks
│   ├── usePermission.ts          # Permission checking
│   ├── useAIAmbientEngine.ts     # AI ambient processing
│   ├── useVoiceInput.ts          # Voice input hook
│   └── ...
├── i18n/                         # Internationalization config
├── locales/                      # Translation files
│   ├── vi/                       # 🇻🇳 Tiếng Việt
│   ├── en/                       # 🇬🇧 English
│   └── zh-CN/                    # 🇨🇳 中文
├── lib/                          # Library utilities
├── services/                     # API service layer (83+ files)
│   ├── authService.ts
│   ├── patientService.ts
│   ├── appointmentService.ts
│   ├── prescriptionService.ts
│   ├── billingService.ts
│   ├── ehrService.ts
│   ├── telemedicineService.ts
│   ├── aiService.ts
│   └── ... (83 service files)
├── store/                        # Client-side state
├── types/                        # TypeScript type definitions
└── utils/                        # Utility functions
```

---

## 🚀 Getting Started

### Yêu cầu Hệ thống

| Yêu cầu | Phiên bản |
|----------|-----------|
| **Node.js** | **22.x** (bắt buộc — xem hướng dẫn bên dưới) |
| **npm** | ≥ 11.x |
| **nvm** | Khuyến nghị để quản lý phiên bản Node.js |

> [!WARNING]
> Dự án này **bắt buộc Node.js v22.x** và **npm ≥ 11**. Sử dụng phiên bản khác có thể gây lỗi build. File `.nvmrc` và trường `engines` trong `package.json` đã được cấu hình để enforce điều này.

#### Cài đặt Node.js đúng phiên bản

**Cách 1 — Dùng nvm (khuyến nghị):**

```bash
# Cài đặt Node.js v22 (chỉ cần lần đầu)
nvm install 22

# Chuyển sang phiên bản dự án yêu cầu (đọc .nvmrc tự động)
nvm use
```

**Cách 2 — Cài thủ công:**

Tải và cài đặt Node.js v22.x từ [trang chính thức](https://nodejs.org/).

### Cài đặt & Chạy

```bash
# 1. Clone dự án
git clone https://github.com/minhquan2504/EHealth_Website.git
cd EHealth_Website

# 2. Kích hoạt Node.js đúng phiên bản (nếu dùng nvm)
nvm use

# 3. Cài đặt dependencies
npm install

# 4. Cấu hình môi trường
cp .env.development .env.local
# Chỉnh sửa .env.local với cấu hình của bạn

# 5. Khởi chạy dev server
npm run dev
```

Truy cập [http://localhost:3001](http://localhost:3001) — bạn sẽ được redirect đến trang đăng nhập.

### Biến Môi trường

```env
# Backend API URL (production dùng same-origin proxy)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Backend origin (chỉ Next.js server đọc — không lộ ra browser)
BACKEND_ORIGIN=http://localhost:3000

# Site URL (metadata/OG tags)
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# App Environment
NEXT_PUBLIC_ENV=development
```

> [!NOTE]
> Ở production, `NEXT_PUBLIC_API_URL` được set thành domain chính (HTTPS). Next.js `rewrites` trong `next.config.mjs` sẽ proxy `/api/*` requests sang backend qua HTTP nội bộ, tránh mixed-content block.

### Available Scripts

| Lệnh | Mô tả |
|-------|--------|
| `npm run dev` | Chạy dev server (port 3001, hot reload) |
| `npm run dev:turbo` | Chạy dev server với Turbopack |
| `npm run build` | Build production |
| `npm run start` | Serve production build |
| `npm run lint` | Kiểm tra ESLint |
| `npm run typecheck` | Kiểm tra TypeScript types |
| `npm run test` | Chạy unit tests (Vitest) |
| `npm run test:watch` | Chạy tests watch mode |
| `npm run test:coverage` | Chạy tests với coverage report |
| `npm run test:ui` | Chạy tests với Vitest UI |
| `npm run qc:all` | Chạy toàn bộ QC checks |
| `npm run qc:quick` | Chạy QC nhanh |
| `npm run qc:static` | Chạy static analysis |
| `npm run qc:api` | Chạy API checks |
| `npm run qc:ui` | Chạy UI checks |

---

## 🚀 Triển khai (Jenkins/CI/CD)

### Jenkins Pipeline

Dự án sử dụng **Jenkins** để tự động hóa CI/CD, deploy lên server production tại **dev.thanhhaishopwebsite.id.vn**.

#### Jenkinsfile (Declarative Pipeline)

```groovy
pipeline {
    agent any

    environment {
        NVM_DIR = "${HOME}/.nvm"
        NODE_VERSION = '22'
        APP_DIR = '/var/www/EHealth/EHealth_Website'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/minhquan2504/EHealth_Website.git',
                    credentialsId: 'github-credentials'
            }
        }

        stage('Setup Node.js') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm install ${NODE_VERSION}
                    nvm use ${NODE_VERSION}
                    node -v && npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    cd ${APP_DIR}
                    npm ci
                '''
            }
        }

        stage('Lint & Typecheck') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    cd ${APP_DIR}
                    npm run lint || true
                    npm run typecheck || true
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    cd ${APP_DIR}
                    npm run test || true
                '''
            }
        }

        stage('Build Production') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    cd ${APP_DIR}
                    npm run build
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    cd ${APP_DIR}
                    pm2 restart ehealth-frontend --update-env || pm2 start npm --name ehealth-frontend -- start
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Frontend deployed successfully to dev.thanhhaishopwebsite.id.vn!'
        }
        failure {
            echo '❌ Pipeline failed. Check logs for details.'
        }
    }
}
```

#### Jenkins Shell Script (Đơn giản)

Nếu Jenkins job chạy shell trực tiếp trên server:

```bash
#!/bin/bash
set -e

cd /var/www/EHealth/EHealth_Website

# Activate Node.js v22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22

echo "Node: $(node -v) | npm: $(npm -v)"

# Install, lint, test, build
npm ci
npm run lint || true
npm run typecheck || true
npm run test || true
npm run build

# Restart Next.js server
pm2 restart ehealth-frontend --update-env || pm2 start npm --name ehealth-frontend -- start

echo "✅ Frontend deploy complete! → https://dev.thanhhaishopwebsite.id.vn"
```

> [!IMPORTANT]
> Nếu Jenkins agent **không dùng nvm**, hãy cài đặt Node.js **v22.x** và npm **11+** trực tiếp trên agent. Dự án sẽ hiển thị `EBADENGINE` warnings và có thể fail trên Node 18.

### Sơ đồ CI/CD

```
  Git Push (main)
       │
       ▼
  ┌──────────┐    ┌─────────┐    ┌──────┐    ┌───────────┐    ┌───────┐    ┌────────┐
  │ Checkout  │ ─▶│ Install │ ─▶│ Lint │ ─▶│ Typecheck │ ─▶│ Test  │ ─▶│ Build  │
  └──────────┘    │ npm ci  │    │      │    │           │    │Vitest │    │next    │
                  └─────────┘    └──────┘    └───────────┘    └───────┘    │build   │
                                                                           └───┬────┘
                                                                               │
                                                                          ┌────▼────┐
                                                                          │ Deploy  │
                                                                          │ PM2     │
                                                                          └────┬────┘
                                                                               │
                                                                               ▼
                                                                    🌐 Production
                                                          dev.thanhhaishopwebsite.id.vn
```

### Deployment Architecture

```
                      ┌──────────────────────────┐
                      │    Cloudflare (CDN/SSL)   │
                      └────────────┬─────────────┘
                                   │
                      ┌────────────▼─────────────┐
                      │   Nginx Reverse Proxy     │
                      │   dev.thanhhaishopweb     │
                      │   site.id.vn              │
                      └────────────┬─────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                  │
        ┌─────────▼─────────┐            ┌───────────▼───────────┐
        │  Next.js Frontend  │   proxy   │  Express.js Backend    │
        │  (Port 3001)       │ ─────────▶│  (Port 3000)           │
        │  PM2 managed       │  /api/*   │  PM2 managed           │
        └────────────────────┘           └───────────┬────────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  PostgreSQL Database  │
                                          │  (Docker container)   │
                                          └──────────────────────┘
```

---

## 🗺 Roadmap

### ✅ Đã hoàn thành

- [x] Xác thực đa vai trò (JWT + Firebase)
- [x] Admin portal — 40+ trang quản lý toàn diện
- [x] Doctor portal — Quy trình khám bệnh hoàn chỉnh (queue → exam → diagnosis → prescription → sign-off)
- [x] Pharmacist portal — Phát thuốc, quản lý kho, cảnh báo tồn kho
- [x] Receptionist portal — Tiếp nhận, đặt lịch, check-in, thanh toán
- [x] Patient portal — Đặt lịch, xem bệnh án, hồ sơ sức khỏe, thanh toán
- [x] Cashier portal — Thanh toán offline
- [x] Landing page & public pages
- [x] Hệ thống thông báo (bell + inbox modal)
- [x] Dark mode support
- [x] Import/Export Excel (thuốc, master data, dịch vụ)
- [x] Tích hợp thanh toán SePay (QR Code)
- [x] AI Copilot system (17 components)
- [x] Đa ngôn ngữ (VI, EN, ZH-CN)
- [x] Telemedicine (khám từ xa)
- [x] EHR — Hồ sơ sức khỏe điện tử
- [x] Billing & Finance (hóa đơn, bảng giá, đối soát, hoàn tiền)
- [x] Jenkins CI/CD pipeline
- [x] Deploy production

### 🔮 Kế hoạch Phát triển

- [ ] WebSocket real-time (queue, notifications)
- [ ] In ấn (đơn thuốc, hóa đơn, phiếu khám)
- [ ] Video consultation (WebRTC)
- [ ] Mobile app (Flutter / React Native)
- [ ] SSO (Single Sign-On)

---

## 📄 License

Dự án được phát triển phục vụ **Đồ án Tốt nghiệp**.

Giấy phép: **MIT**

---

<br/><br/>
<hr/>
<br/><br/>

<div align="center">

# EHealth Website — Frontend [English]

### Comprehensive Digital Healthcare Management Platform

**Authors:** Nguyễn Minh Quân &nbsp;•&nbsp; Phan Thanh Hải &nbsp;|&nbsp; **Graduation Thesis**

🔗 **Live Demo:** [https://dev.thanhhaishopwebsite.id.vn](https://dev.thanhhaishopwebsite.id.vn)

</div>

---

## 📋 Overview

**EHealth Website** is the frontend web application of a comprehensive Digital Healthcare Management System. Built with **Next.js 14 (App Router)** and **TypeScript**, it provides **6 dedicated portals** for different user roles: Admin, Doctor, Pharmacist, Receptionist, Cashier, and Patient — each with custom dashboards, sidebars, and layouts.

### Key Highlights

- 🎨 **Modern UI** — Glassmorphism login, dark mode, micro-animations (Framer Motion)
- 🤖 **AI Copilot** — Integrated AI assistant with command palette, voice input, context-aware suggestions
- 🌐 **Multilingual (i18n)** — Vietnamese, English, Chinese (next-intl)
- 📱 **Fully Responsive** — Works on all screen sizes
- 🔐 **Route Guards** — Role-based route protection with auto-redirect
- 🔔 **Real-time Notifications** — Bell icon, inbox modal, toast system
- 💬 **Floating ChatBox** — Support chat available on every page
- 🧪 **Testing** — Vitest + React Testing Library + Playwright

---

## 👥 User Roles & Portals

| Role | Portal | Pages | Description |
|------|--------|-------|-------------|
| 🛡️ **Admin** | `/admin` | 40+ | System management, users, RBAC, master data, statistics |
| 🩺 **Doctor** | `/portal/doctor` | 21+ | Patient queue, examination, diagnosis (ICD-10), prescriptions, EMR/EHR, telemedicine |
| 💊 **Pharmacist** | `/portal/pharmacist` | 10+ | Prescription dispensing, inventory, stock alerts |
| 🏥 **Receptionist** | `/portal/receptionist` | 13+ | Patient registration, appointments, check-in, queue, billing |
| 💰 **Cashier** | `/portal/cashier` | — | Offline payments, cashier authentication |
| 👤 **Patient** | `/patient` | 9+ | Appointments, medical records, health records, billing, telemedicine, AI consult |

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **UI** | React 18 |
| **Styling** | Tailwind CSS 3 + CSS Variables |
| **Animation** | Framer Motion 12 |
| **HTTP** | Axios |
| **i18n** | next-intl 4 (VI, EN, ZH-CN) |
| **Icons** | Google Material Symbols |
| **Testing** | Vitest + React Testing Library + Playwright |
| **CI/CD** | Jenkins Pipeline |

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/minhquan2504/EHealth_Website.git
cd EHealth_Website

# 2. Use correct Node.js version (requires v22)
nvm use  # reads .nvmrc

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.development .env.local

# 5. Start dev server
npm run dev
# → http://localhost:3001
```

### Jenkins CI/CD

```bash
cd /var/www/EHealth/EHealth_Website
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22 && nvm use 22
npm ci && npm run build
pm2 restart ehealth-frontend --update-env || pm2 start npm --name ehealth-frontend -- start
```

---

## 📄 License

Developed as a **graduation thesis project**. Licensed under **MIT**.

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS & Framer Motion**

</div>
