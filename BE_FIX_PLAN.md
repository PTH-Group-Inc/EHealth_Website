# Plan fix BE để FE đạt 100% coverage spec

**Gửi:** BE team (E-Health_server + EHealth-Api)
**Ngày:** 2026-04-20 (update lần 2)
**Trạng thái FE:** ~92% coverage, pushed `9089602` trên `pth/main`
**Mục tiêu:** Đưa toàn bộ page admin hoạt động 100% với dữ liệu thực

## ✅ BE đã fix (commits `c047a0d` + `3c244c9` trên EHealth-Api main)

- `/api/facility-status/today` → **OK** (page `/admin/facility-status` hoạt động, hiện dữ liệu thực)
- `/api/appointment-changes/stats` → **OK** (page `/admin/appointment-changes` hoạt động)
- `/api/treatment-plans/*` routes → **đã register** (401 thay vì 404 — BE đã add route, chưa test auth)
- `/api/billing/refunds/requests` → **đã register** (401 thay vì 500)
- `/api/teleconsultation/prescriptions` → **đã register** (401 thay vì 500)
- `/api/notifications/role-configs` → **đã register** (401 thay vì 500)
- `/api/patient/profiles` → **đã register** (401 thay vì 500)

## ⏳ Còn lại cần fix

- `/api/locked-slots/locked` — **vẫn 400** khi gọi không có param. Cần check params yêu cầu hoặc relax validation.

---

## 📋 Tổng quan

FE đã implement đầy đủ UI cho 86 MH theo spec "Sửa giao diện.md" (4554 dòng, 7 nhóm).
Tất cả page đã defensive coding với `try/catch + EmptyState` — khi BE trả lỗi, page
vẫn render, chỉ hiển thị cảnh báo "Không tải được dữ liệu".

Mục tiêu của plan này: **BE fix các endpoint dưới đây để page hoạt động 100% với
dữ liệu thực**, không còn empty state do lỗi BE.

---

## 🔴 PRIORITY 1 — Endpoints đang 404 (chức năng chính không dùng được)

### 1.1. Treatment Plan — `/api/treatment-plans` → 404

**Impact:** Không dùng được trang `/portal/doctor/treatment-plans/[id]` (Nhóm 4 EHR).

**Endpoints cần BE implement (theo spec line 2923-3003):**

```
GET    /api/treatment-plans                         — list aggregate (hiện chưa có)
POST   /api/treatment-plans                         — tạo plan mới
GET    /api/treatment-plans/by-patient/:patientId   — list theo bệnh nhân (đã có)
GET    /api/treatment-plans/:planId                 — chi tiết
PUT    /api/treatment-plans/:planId                 — cập nhật
PATCH  /api/treatment-plans/:planId/status          — đổi trạng thái
GET    /api/treatment-plans/:planId/notes           — list notes
POST   /api/treatment-plans/:planId/notes           — thêm note
GET    /api/treatment-plans/:planId/follow-ups      — list follow-ups
POST   /api/treatment-plans/:planId/follow-ups      — tạo follow-up
GET    /api/treatment-plans/:planId/summary         — tổng hợp
```

**FE file impacted:** `src/services/treatmentPlanService.ts` (chờ sẵn).

---

### 1.2. Patient Profile — `/api/patient/profiles` → 5xx

**Impact:** Không tải được hồ sơ tổng hợp bệnh nhân (Nhóm 3).

**Điều cần fix:**
- Hiện endpoint trả 500 Internal Server Error
- Có thể do schema mismatch hoặc thiếu join
- FE đã map theo nhiều field names (`users_id`, `patient_id`, `patients_id`)

**FE file impacted:** `src/app/portal/receptionist/patients/[id]/page.tsx`

---

## 🟡 PRIORITY 2 — Endpoints đang 400 (page mở được nhưng rỗng)

### 2.1. Locked Slots — `/api/locked-slots/locked` → 400

**Impact:** Trang `/admin/slots/locked` không load được danh sách slot bị khoá.

**Nguyên nhân khả năng:** BE yêu cầu param bắt buộc nhưng chưa document.

**Điều cần BE check:**
- Đã test với các param: `?limit=500`, `?facility_id=...`, không có param
- Cả 3 đều trả 400. Cần document params bắt buộc hoặc fix để chấp nhận no-param.

**FE file impacted:** `src/app/admin/slots/locked/page.tsx`

---

### 2.2. Facility Status — `/api/facility-status/*` → 400

**Impact:** Trang `/admin/facility-status` không hiển thị today + calendar view.

**Endpoints lỗi:**

```
GET /api/facility-status/today          → 400
GET /api/facility-status/calendar       → 400
GET /api/facility-status/date/:date     → chưa test
```

**Điều cần fix:** Tương tự locked-slots, có thể BE yêu cầu param.

---

### 2.3. Appointment Changes Stats — `/api/appointment-changes/stats` → 400

**Impact:** Trang `/admin/appointment-changes` vẫn hoạt động (FE fallback compute từ
`/recent`), nhưng mất thống kê tổng.

**Điều cần fix:** Check params hoặc body format.

---

### 2.4. Billing Refunds — `/api/billing/refunds/requests` → 5xx

**Impact:** Trang `/admin/refunds` không tải được yêu cầu hoàn tiền.

**Điều cần fix:** Investigate 500 error, có thể join thiếu bảng hoặc query SQL sai.

---

### 2.5. Teleconsultation Prescriptions — `/api/teleconsultation/prescriptions` → 5xx

**Impact:** Trang `/admin/teleconsultation/prescriptions` không load được.

---

## 🟢 PRIORITY 3 — Endpoints chưa expose (các MH thứ yếu)

### 3.1. Bulk create slots — `POST /api/slots/bulk`

**Impact:** Trang `/admin/slots/config` có modal "Tạo hàng loạt" nhưng click Submit sẽ lỗi.

**Spec yêu cầu:** BE nên hỗ trợ tạo nhiều slot cùng lúc theo khoảng ngày + slot duration.

**Payload FE sẽ gửi:**
```json
{
  "doctor_id": "uuid",
  "dates": ["2026-04-21", "2026-04-22", ...],
  "start_time": "08:00",
  "end_time": "17:00",
  "slot_duration": 30,
  "capacity": 1
}
```

---

### 3.2. Consultation Durations bulk — `PATCH /api/facilities/:id/service-durations`

**Impact:** Trang `/admin/facilities/service-durations` có nút "Áp dụng hàng loạt" sẽ
không hoạt động nếu BE chưa hỗ trợ.

**Payload FE sẽ gửi:**
```json
{ "duration_minutes": 30, "apply_all": true }
```

---

### 3.3. Lock-by-shift — `POST /api/locked-slots/lock-by-shift`

**Impact:** Modal "Khoá theo ca" trong `/admin/slots/locked`.

**Payload:**
```json
{
  "shift_id": "uuid",
  "start_date": "2026-04-21",
  "end_date": "2026-04-28",
  "reason": "Bác sĩ nghỉ phép"
}
```

---

## 🔵 PRIORITY 4 — Schema quirks đã phát hiện (chỉ cần document)

FE đã map nhiều alias, nhưng để BE thống nhất sẽ gọn hơn:

### 4.1. Inconsistent ID naming

BE đang dùng nhiều cách đặt tên ID khác nhau cho cùng entity:

| Entity | Tên BE hiện tại | FE map ưu tiên |
|---|---|---|
| Encounter | `encounters_id` / `encounter_id` | `encounters_id` |
| Bed | `beds_id` / `bed_id` | `beds_id` |
| Branch | `branches_id` / `branch_id` | `branches_id` |
| Medical Room | `medical_rooms_id` / `medical_room_id` / `rooms_id` | `medical_rooms_id` |
| Equipment | `equipments_id` / `equipment_id` | `equipments_id` |
| Staff | `users_id` / `staff_id` / `id` | `users_id` |
| Leave | `leaves_id` / `leave_id` | `leaves_id` |
| Shift | `shifts_id` / `shift_id` | `shifts_id` |

**Đề xuất:** BE chuẩn hoá về `{entity}s_id` cho PK primary (plural + _id).

### 4.2. Department dropdown yêu cầu branch_id

**Hiện tại:**
- `GET /api/departments/dropdown` → 400 `DEPT_003` nếu không có `branch_id`

**Vấn đề:** Nhiều page admin cần dropdown khoa dùng chung (không gắn với branch cụ thể).

**Đề xuất:** BE làm `/api/departments/dropdown` chấp nhận không param = trả all active departments. FE đang workaround dùng `/api/departments?limit=500`.

### 4.3. Status normalization

BE trả về `status` với nhiều casing khác nhau (`ACTIVE` / `active` / `Active`).
FE normalize bằng `String(s).toUpperCase()` nhưng nên chuẩn hoá BE về UPPERCASE.

---

## 📝 Testing checklist cho BE sau khi fix

Sau khi fix, BE test qua Postman/Thunder các endpoint sau để xác nhận:

```
✅ GET  /api/treatment-plans?limit=50              → 200 + list
✅ GET  /api/patient/profiles?user_id=<UUID>       → 200 + detail
✅ GET  /api/locked-slots/locked                   → 200 + array
✅ GET  /api/facility-status/today                 → 200 + array
✅ GET  /api/facility-status/calendar              → 200 + array
✅ GET  /api/appointment-changes/stats             → 200 + counts
✅ GET  /api/billing/refunds/requests              → 200 + list
✅ GET  /api/teleconsultation/prescriptions        → 200 + list
✅ POST /api/slots/bulk                            → 201 + created array
✅ PATCH /api/facilities/{id}/service-durations    → 200 (with apply_all: true)
✅ POST /api/locked-slots/lock-by-shift            → 201
```

---

## 🧪 Cách FE verify sau khi BE fix

FE không cần build lại. Chỉ cần:

1. BE deploy fix
2. FE team reload các trang dưới đây trong browser:
   - `/admin/slots/locked`
   - `/admin/facility-status`
   - `/admin/appointment-changes`
   - `/admin/refunds`
   - `/admin/teleconsultation/prescriptions`
   - `/portal/doctor/treatment-plans/[id]`
3. Xác nhận page hiển thị dữ liệu thực thay vì "Không tải được..."

---

## 📞 Liên hệ

FE đã push toàn bộ 11 commit lên `pth main` (`6deb404` mới nhất).
Khi BE có thay đổi API/schema, báo FE team để cập nhật mapping nếu cần.

**FE contact:** Minh Quân (claude1@innotech-vn.com)
