# Quy tắc dự án Antigravity (BẮT BUỘC)

Tất cả agent/AI làm việc trong repo này PHẢI tuân thủ.

## 1) Nguồn sự thật duy nhất (Tài liệu)
Toàn bộ tài liệu dự án CHỈ được lưu trong:
- README.md (thông tin dự án, cách chạy, quyết định, giả định, roadmap, ghi chú)
- project_structure.md (kiến trúc, sơ đồ thư mục, trách nhiệm module, entry points)

MẶC ĐỊNH KHÔNG tạo file tài liệu rời rạc như:
- requirements.md, specs.md, design.md, notes.md, test-plan.md, todo.md,...

Nếu cần ghi tài liệu, hãy bổ sung vào README.md hoặc project_structure.md.

## 2) Chính sách Roadmap
- Roadmap PHẢI nằm trong README.md dưới mục: "## Lộ trình"
- Dùng checklist: [ ] / [x]
- Hoàn thành việc gì thì cập nhật checklist ngay
- Mỗi mục roadmap phải nhỏ và kiểm thử được

Đánh dấu [x] chỉ khi:
- Code/triển khai xong
- Có kiểm thử tối thiểu
- README/project_structure được cập nhật nếu có ảnh hưởng

## 3) Chính sách tạo file (Chống file rác)
Mặc định: KHÔNG tạo file mới.

Ngoại lệ cho phép:
A) ĐƯỢC tạo/sửa file CODE/TEST/CONFIG nếu BẮT BUỘC để làm đúng yêu cầu.
B) File mới phải tối giản và có lý do rõ ràng (ví dụ: module mới, migration, test).

Quy tắc cứng:
- Không tạo file tài liệu kế hoạch/ghi chú riêng lẻ.
- Thay đổi kiến trúc -> cập nhật project_structure.md.
- Thay đổi cách chạy/config/env -> cập nhật README.md.

## 4) Quy trình làm việc (BA -> DEV -> QC)
MỌI yêu cầu đều phải trả lời theo thứ tự:
1) Phân tích
2) Giả định
3) Kế hoạch

Sau đó chạy pipeline:
- BA: yêu cầu + tiêu chí nghiệm thu + rủi ro
- DEV: triển khai tối thiểu
- QC: kịch bản test + rủi ro hồi quy

## 5) An toàn (Secrets, Terminal, lệnh nguy hiểm)
- Không bao giờ in ra secrets: .env, token, key, credential, private key.
- Không chạy lệnh phá hoại (rm -rf, reset DB, drop schema...) trừ khi user yêu cầu rõ và xác nhận.
- Trước mọi lệnh thay đổi hệ thống, PHẢI hiển thị:
  - Lệnh sẽ chạy
  - Tác động
  - Cách rollback (nếu có)

## 6) Kỷ luật output
- Ưu tiên thay đổi nhỏ, incremental
- Tránh refactor lan man
- Chỉ hỏi khi thật sự bị chặn (tối đa 1 câu hỏi ngắn)
- Toàn bộ nội dung trao đổi, tên màn hình, label UI: ƯU TIÊN TIẾNG VIỆT
