# EHealth — Danh sách công việc BE cần xử lý

**Repo FE:** `/Users/minhquan/EH/EHealth_Website` (branch `main` @ `5e7cebb`)
**BE remote:** `http://160.250.186.97:3000` (snake_case)
**Cập nhật:** 2026-05-18

---

## 🔴 Mức độ Blocker — feature FE không chạy được nếu BE chưa fix

### 1. Auto-generate `code` cho 10 entity admin

**Vì sao:** FE đã bỏ field "Mã" thủ công khỏi 10 modal Create. Nếu BE schema còn yêu cầu `code NOT NULL` và không có default → INSERT fail → user không tạo entity mới được.

**Entity và endpoint:**

| Entity | Endpoint | DB column cần auto-gen |
|---|---|---|
| Chi nhánh | `POST /api/branches` | `branches.code` hoặc `branch_code` |
| Khoa/Phòng ban | `POST /api/departments` | `departments.code` |
| Giường bệnh | `POST /api/beds` | `beds.code` hoặc `bed_code` |
| Thiết bị | `POST /api/medical-equipment` | `medical_equipment.code` |
| Phòng khám | `POST /api/medical-rooms` | `medical_rooms.code` |
| Chuyên khoa | `POST /api/specialties` | `specialties.code` |
| Dịch vụ master | `POST /api/medical-services/master` | `medical_services.code` |
| Kho | `POST /api/warehouses` | `warehouses.code` |
| Nhà cung cấp | `POST /api/suppliers` | `suppliers.code` |
| Nhóm thuốc | `POST /api/pharmacy/categories` | `pharmacy_categories.code` |

**Cần làm:**
- DB schema: cột code phải có DEFAULT hoặc trigger AUTO_INCREMENT-like
- Service layer: nếu payload không có `code` → sinh tự động (vd `BR-{timestamp}-{random}` hoặc `BR-001` sequential)
- Validation: bỏ `code` khỏi required field trong DTO

**Test verify:**
```bash
curl -X POST http://160.250.186.97:3000/api/branches \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Chi nhánh","facility_id":"<uuid>"}'
```
Kỳ vọng: 201 Created với entity mới có `code` BE tự sinh.

---

### 2. Endpoint `/api/appointments/pre-book` — deposit flow

**Vì sao:** FE đã có UI pre-booking với SePay QR thanh toán cọc. Hiện FE phải fallback sang `createAppointment()` cổ điển nếu BE trả 404/405/501.

**File FE:** `src/app/(public)/booking/page.tsx:762`

**Cần làm:**
- Xác nhận endpoint `POST /api/appointments/pre-book` đã có chưa
- Nếu chưa: tạo endpoint với payload tương tự `/api/appointments` + thêm field deposit (`deposit_amount`, `deposit_status: PENDING|PAID`)
- Response cần trả `invoice_id` để FE redirect sang `/payment/[invoiceId]`

---

### 3. Endpoint `/api/doctors/{id}/reviews` — Doctor reviews

**Vì sao:** Public doctor detail page có section "Đánh giá" nhưng không hiển thị data.

**File FE:** `src/app/(public)/doctors/[id]/page.tsx:344` (có comment "BE chưa có API reviews")

**Cần làm:**
- Tạo endpoint `GET /api/doctors/{id}/reviews?page=&limit=` trả danh sách review
- Schema: `{ id, patient_name, rating (1-5), comment, created_at }`
- Có thể stub trả empty array trước, FE sẽ hiện EmptyState

---

### 4. Batch endpoint cho Staff Schedule — AI auto-assign

**Vì sao:** FE có button "AI tự động phân lịch" tạo 50-100+ schedule trong 1 lần. Hiện FE bắn N POST liên tiếp đến `/api/staff-schedules` → rate limit risk + chậm.

**File FE:** `src/app/admin/staff-schedule/page.tsx` (commit `1f3de96`)

**Cần làm:**
- Tạo endpoint `POST /api/staff-schedules/batch`
- Payload: `{ assignments: [{ staff_id, shift_id, work_date, status }, ...] }`
- Atomic transaction: nếu 1 fail thì rollback hoặc trả partial success với `failed_indices`

**Hoặc** (giải pháp đơn giản): tăng rate limit cho role admin trên `/api/staff-schedules`.

---

### 5. Endpoint `/api/slots/bulk` — Bulk tạo slot

**Vì sao:** FE modal "Tạo slot hàng loạt" gọi `/api/slots/bulk` 2 lần (ca sáng + chiều). Toast hint "có thể BE chưa hỗ trợ".

**File FE:** `src/app/admin/slots/config/page.tsx:301`

**Payload FE gửi:**
```json
{
  "doctor_id": "uuid",
  "dates": ["2026-05-18", "2026-05-19", ...],
  "start_time": "07:00",
  "end_time": "11:00",
  "slot_duration": 45,
  "capacity": 1
}
```

**Cần làm:**
- Verify endpoint tồn tại + chấp nhận shape trên
- Idempotent: gọi lại với cùng input không tạo duplicate
- Conflict handling: nếu doctor đã có slot trong khoảng → trả 409 với chi tiết

---

## 🟠 Mức độ High — response shape không nhất quán → FE workaround

### 6. Standardize list response shape

**Vấn đề:** FE helper `unwrapList()` phải duyệt 5 shape khác nhau:

```ts
Array.isArray(res.data?.items)      // shape 1
Array.isArray(res.data?.data)       // shape 2
Array.isArray(res.data)             // shape 3
Array.isArray(res.items)            // shape 4
Array.isArray(res)                  // shape 5 (root array)
```

**File FE bị ảnh hưởng** (>15 file): toàn bộ admin pages CRUD + portal pages list.

**Cần làm:** Chọn 1 format duy nhất cho TẤT CẢ list endpoint, document trong Swagger. Khuyến nghị:

```json
{
  "success": true,
  "data": [/* items */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

---

### 7. Unify ID field naming

**Vấn đề:** ID field có 2-3 tên khác nhau cho cùng entity:

| Entity | Variants |
|---|---|
| Branch | `branches_id`, `branch_id`, `id` |
| Department | `departments_id`, `department_id`, `id` |
| Facility | `facilities_id`, `facility_id`, `id` |
| User | `users_id`, `user_id`, `id` |
| Patient | `patient_id`, `id`, `patient_code` |
| Staff | `staffs_id`, `staff_id`, `users_id` |

**FE workaround:** Mỗi mapper duyệt 3 candidate (vd `r.branches_id ?? r.branch_id ?? r.id`).

**Cần làm:**
- Pick 1 convention: khuyến nghị `{entity}_id` snake_case (vd `branch_id`)
- Update toàn bộ response (LIST + DETAIL + nested) trả đúng 1 field name
- Update Swagger docs

---

### 8. Unify name field

**Vấn đề:** Tên người có 3 variants: `full_name`, `fullName`, `name`. FE phải 3-way fallback.

**Files FE:** `users/page.tsx`, `doctors/[id]/edit/page.tsx`, `leaves/page.tsx`, `shift-swaps/page.tsx`, 4+ file khác.

**Cần làm:** BE chọn `full_name` (snake_case) cho toàn bộ endpoint trả thông tin người.

---

## 🟡 Mức độ Medium — BE thiếu data → FE phải aggregate

### 9. Department stats

**Vấn đề:** `GET /api/departments` trả `doctor_count = 0` và `patient_count = 0` cho mọi khoa, dù DB có data.

**FE workaround hiện tại:** Sau khi load departments, FE load thêm `/api/staff?limit=500` và `/api/appointments?date=today&limit=500`, aggregate count theo `department_id`.

**Impact:** 3 API call/page load thay vì 1.

**File FE:** `src/app/admin/departments/page.tsx:80-82`

**Cần làm:**
- Endpoint `/api/departments` JOIN với `staff` + `appointments` để trả đúng count
- Hoặc tạo riêng `/api/departments/stats` trả `{ department_id, doctor_count, patient_count_today, appointment_today }`

---

### 10. Specialty stats — doctor count + service count

**Tương tự #9** cho specialties. FE hiện load thêm `/api/staff` + `/api/specialty-services/{id}/services` cho TỪNG specialty (N+1 query).

**File FE:** `src/app/admin/specialties/page.tsx` (commit `9762102`)

---

### 11. Numeric field types không nhất quán

**Vấn đề:** `price`, `amount`, `quantity` trả khi string, khi number tùy endpoint.

**FE workaround:** `Number(item.price ?? 0)`, `parseFloat(r.amount)`.

**Cần làm:** Database query luôn CAST về number trước khi trả về (đặc biệt cột DECIMAL trong MySQL/Postgres mặc định trả string).

---

### 12. Patient `relationship` field — BE chưa persist

**File FE:** `src/utils/patientMapper.ts:25` (comment "localStorage polyfill")

**Vấn đề:** FE cho user chọn relationship khi book hộ người thân, nhưng BE không lưu → FE persist trong localStorage.

**Cần làm:** Thêm cột `relationship` (enum: SELF, SPOUSE, CHILD, PARENT, OTHER) vào bảng patient_profiles, return trong response.

---

## ⚪ Mức độ Low — tech debt

### 13. Số endpoint redirects 404 thay vì 405

Một số endpoint sai method trả 404 thay vì 405 Method Not Allowed → FE hard để phân biệt "endpoint không tồn tại" vs "method sai".

### 14. Pagination metadata

Một số list endpoint không trả `pagination` object → FE không hiển thị page count, phải đoán.

### 15. Snake_case ↔ camelCase mapping

Service layer FE hiện accept cả 2 format trong payload (`slotId || slot_id`). Có thể bỏ nếu BE/FE thống nhất 1 convention.

---

## 📋 Top 5 báo cáo team BE tuần này

| # | Việc | Mức | Người làm | Deadline |
|---|---|---|---|---|
| 1 | Auto-gen `code` cho 10 entity | 🔴 | DB + API | Trước demo đồ án |
| 2 | Verify `/api/appointments/pre-book` | 🔴 | API | Trước demo đồ án |
| 3 | Stub `/api/doctors/{id}/reviews` (trả empty array) | 🔴 | API | Trong tuần |
| 4 | Standardize list response shape | 🟠 | API + Docs | Trong tuần |
| 5 | Department + specialty stats endpoint | 🟡 | DB + API | Tuần sau |

---

## Liên hệ FE

- **Repo:** https://github.com/PTH-Group-Inc/EHealth_Website
- **Test account admin:** `admin@ehealth.vn` / `Admin@123`
- **Dev FE:** port 3001 (`npm run dev`)
- **Test verify BE fix:** đăng nhập admin → vào từng module → bấm "Tạo mới"
