# Workflow làm việc với AI khi phát triển chức năng SportLife

Tài liệu này hướng dẫn cách làm việc với AI/Codex khi phát triển chức năng trong dự án SportLife. Mục tiêu là giúp mỗi lần bắt đầu một đoạn chat mới vẫn giữ được quy trình nhất quán: đọc tài liệu trước, hiểu scope, inspect code, triển khai, kiểm tra và cập nhật tiến độ.

## Lưu ý quan trọng về Database

PostgreSQL của dự án đang chạy bằng Docker Compose. Người dùng không cần thao tác trực tiếp với database khi phát triển chức năng; AI/Codex có thể chủ động xử lý phần DB trong phạm vi phát triển.

Khi chức năng cần thay đổi database, AI cần tự đọc và xử lý các phần liên quan:

- `docker-compose.yml`
- `frontend/prisma/schema.prisma`
- `frontend/prisma/seed.ts`
- `frontend/.env.example`
- Các service/action đang đọc ghi database.

AI có thể thực hiện các việc sau khi cần:

- Thiết kế model, enum, relation và constraint mới trong Prisma schema.
- Cập nhật seed data để có dữ liệu mẫu phục vụ test UI/flow.
- Chạy `prisma validate`, `prisma generate`, `db:push` hoặc migration phù hợp với trạng thái dự án.
- Kiểm tra dữ liệu qua Prisma hoặc Docker nếu cần.
- Báo rõ đã thay đổi model nào, command DB nào đã chạy và có cần reset/reseed dữ liệu hay không.

Quy tắc an toàn:

- Không tự ý xóa dữ liệu, drop table, reset database volume hoặc chạy lệnh destructive nếu chưa hỏi người dùng trước.
- Nếu cần reset DB để test luồng mới, AI phải nói rõ lý do và xin xác nhận.
- Nếu thay đổi schema lớn, AI cần ưu tiên cách ít rủi ro cho dữ liệu hiện có.
- Các thao tác DB phải đi qua Prisma/Docker workflow của dự án, không chỉnh tay dữ liệu production.

## 1. Nguyên tắc chung

- Luôn yêu cầu AI đọc tài liệu dự án trước khi phát triển chức năng mới.
- SRS là nguồn sự thật chính cho scope v1.0.0.
- Không tự ý thêm chức năng ngoài scope như thanh toán, booking settlement, rating/review hoặc push notification nếu chưa cập nhật yêu cầu.
- Backend hiện được triển khai trong Next.js app tại `frontend/`, không có backend service riêng.
- Docker Compose là runtime mặc định cho local development.
- Trước khi sửa code, AI phải inspect code gần khu vực cần thay đổi.
- Sau khi sửa code, AI cần chạy kiểm tra phù hợp nếu có thể.
- Khi hoàn thành chức năng, AI cần cập nhật tài liệu/checklist tiến độ liên quan.

## 2. Tài liệu cần đọc trước khi làm

Khi bắt đầu một chức năng mới, yêu cầu AI đọc tối thiểu các file sau:

- `AGENTS.md`
- `README.md`
- `docs/SRS_SportLife_v1.0.0.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `frontend/AGENTS.md`

Nếu làm chức năng cho role Chủ sân, đọc thêm:

- `docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md`

Nếu làm các module khác, đọc thêm tài liệu/module README liên quan trong `frontend/src/features`, ví dụ:

- `frontend/src/features/auth/README.md`
- `frontend/src/features/venues/README.md`
- `frontend/src/features/matches/README.md`
- `frontend/src/features/community/README.md`
- `frontend/src/features/chat/README.md`
- `frontend/src/features/notifications/README.md`
- `frontend/src/features/admin/README.md`

## 3. Quy trình làm việc đề xuất

### Bước 1: Mô tả chức năng cần làm

Bạn nên mô tả rõ:

- Chức năng thuộc role nào.
- Người dùng cần làm được gì.
- Màn hình hoặc route liên quan nếu đã biết.
- Điều kiện nghiệp vụ quan trọng.
- Có cần cập nhật tài liệu/checklist không.

Ví dụ:

```text
Hãy phát triển dashboard cho role Chủ sân.

Yêu cầu:
- Hiển thị tổng số venue theo trạng thái duyệt.
- Hiển thị venue bị từ chối cần chỉnh sửa.
- Hiển thị số thông báo/tin nhắn chưa đọc.
- Sau khi làm xong, cập nhật checklist tiến độ trong docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md.
```

### Bước 2: Yêu cầu AI đọc docs trước

Prompt nên nhắc rõ AI đọc tài liệu trước khi code:

```text
Trước khi làm, hãy đọc AGENTS.md, README.md, SRS, IMPLEMENTATION_PLAN, frontend/AGENTS.md và tài liệu liên quan đến chức năng này.
Sau đó inspect code hiện tại rồi mới triển khai.
```

Với chức năng Chủ sân, có thể dùng:

```text
Trước khi làm, hãy đọc docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md và code liên quan đến venue-owner, venues, chat, notifications.
```

### Bước 3: AI xác nhận scope và kế hoạch ngắn

Trước khi sửa nhiều file, AI nên tóm tắt ngắn:

- Chức năng này có nằm trong scope v1.0.0 không.
- Các file/module dự kiến sẽ chạm vào.
- Cách kiểm tra sau khi làm.

Ví dụ câu trả lời mong muốn từ AI:

```text
Tôi đã đọc docs liên quan. Chức năng dashboard Chủ sân nằm trong hướng phát triển tiếp theo và không vi phạm scope v1.0.0.
Tôi sẽ kiểm tra route venue-owner, service venues, notification/chat service, sau đó cập nhật UI dashboard và checklist tiến độ.
```

### Bước 4: Triển khai theo pattern hiện có

Khi code, AI cần:

- Đi theo cấu trúc hiện tại trong `frontend/src/app` và `frontend/src/features`.
- Giữ business rules ở server-side service/action.
- Enforce authorization ở server, không chỉ ở UI.
- Dùng validation schema hiện có hoặc bổ sung schema có typed validation.
- Tránh refactor rộng nếu không cần thiết.
- Không xóa hoặc rewrite file không liên quan.

### Bước 5: Kiểm tra sau khi làm

Tùy thay đổi, yêu cầu AI chạy một hoặc nhiều lệnh:

```powershell
cd frontend
npm run lint
npm run typecheck
npm run test
```

Nếu thay đổi liên quan Docker/Compose:

```powershell
docker compose config
```

Nếu thay đổi UI quan trọng, có thể yêu cầu mở app và kiểm tra bằng browser hoặc Playwright nếu môi trường cho phép.

### Bước 6: Cập nhật tài liệu và checklist tiến độ

Khi hoàn thành chức năng, AI cần cập nhật tài liệu liên quan.

Với Chủ sân, cập nhật:

- `docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md`

Cần cập nhật các phần:

- Chuyển hạng mục từ `Cần phát triển` sang `Đã hoàn thành` nếu đã làm xong.
- Thêm ghi chú ngắn về implementation nếu cần.
- Bổ sung tiêu chí nghiệm thu hoặc test nếu chức năng mới có rule đáng chú ý.
- Nếu phát sinh chức năng tiếp theo, thêm vào danh sách phát triển tiếp theo.

## 4. Prompt mẫu để bắt đầu chat mới

Dùng prompt này khi bạn tạo đoạn chat mới để tiết kiệm token:

```text
Bạn đang làm trong repo SportLife tại d:\Semester_8\EXE201\SportLife.

Trước khi phát triển chức năng, hãy đọc:
- AGENTS.md
- README.md
- docs/SRS_SportLife_v1.0.0.md
- docs/IMPLEMENTATION_PLAN.md
- frontend/AGENTS.md
- các tài liệu trong docs liên quan đến chức năng được yêu cầu
- các file code liên quan trong frontend/src/app và frontend/src/features

Quy tắc:
- SRS là nguồn sự thật cho scope v1.0.0.
- Không tự ý thêm thanh toán, booking settlement, rating/review hoặc push notification.
- Backend hiện nằm trong Next.js app ở frontend/.
- Docker Compose là runtime mặc định.
- Trước khi sửa code, inspect code gần khu vực cần thay đổi.
- Sau khi sửa, chạy lint/typecheck/test phù hợp nếu có thể.
- Khi làm xong, cập nhật checklist tiến độ trong tài liệu liên quan.

Nhiệm vụ: [mô tả chức năng cần làm]
```

## 5. Prompt mẫu cho chức năng Chủ sân

```text
Hãy phát triển chức năng [tên chức năng] cho role Chủ sân trong SportLife.

Trước khi làm, hãy đọc:
- AGENTS.md
- README.md
- docs/SRS_SportLife_v1.0.0.md
- docs/IMPLEMENTATION_PLAN.md
- docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md
- frontend/AGENTS.md
- code liên quan trong frontend/src/features/venue-owner-profile, venues, chat, notifications, admin
- route liên quan trong frontend/src/app/venue-owner, frontend/src/app/venues, frontend/src/app/chat, frontend/src/app/notifications

Yêu cầu chức năng:
- [gạch đầu dòng yêu cầu 1]
- [gạch đầu dòng yêu cầu 2]
- [gạch đầu dòng yêu cầu 3]

Quy tắc triển khai:
- Làm theo scope v1.0.0.
- Không thêm booking, thanh toán, rating/review hoặc push notification nếu tôi chưa yêu cầu.
- Enforce authorization ở server-side.
- Làm theo pattern hiện có trong codebase.
- Sau khi làm xong, chạy kiểm tra phù hợp.
- Cuối cùng, cập nhật checklist tiến độ trong docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md.
```

## 6. Prompt mẫu yêu cầu cập nhật checklist sau khi làm xong

Nếu AI đã code xong nhưng chưa cập nhật tài liệu, dùng prompt này:

```text
Hãy cập nhật checklist tiến độ trong tài liệu liên quan.

Với chức năng Chủ sân, cập nhật docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md:
- Chuyển các hạng mục vừa hoàn thành từ Cần phát triển sang Đã hoàn thành.
- Thêm ghi chú ngắn về chức năng đã triển khai.
- Bổ sung tiêu chí nghiệm thu/test nếu cần.
- Nếu còn phần chưa làm, ghi rõ là Cần phát triển hoặc Chưa hoàn thành.
```

## 7. Prompt mẫu yêu cầu báo cáo kết quả

Sau khi AI triển khai, bạn có thể yêu cầu báo cáo theo mẫu:

```text
Hãy báo cáo kết quả theo format:
- Chức năng đã triển khai
- File đã sửa
- Kiểm tra đã chạy
- Checklist/tài liệu đã cập nhật
- Phần còn lại hoặc rủi ro nếu có
```

## 8. Checklist cho mỗi lần phát triển chức năng

| Bước | Nội dung | Trạng thái |
| --- | --- | --- |
| 1 | Đọc `AGENTS.md` và hướng dẫn cục bộ | Chưa làm |
| 2 | Đọc SRS và implementation plan | Chưa làm |
| 3 | Đọc tài liệu feature liên quan | Chưa làm |
| 4 | Inspect code hiện tại | Chưa làm |
| 5 | Xác nhận scope và rule nghiệp vụ | Chưa làm |
| 6 | Triển khai code | Chưa làm |
| 7 | Chạy lint/typecheck/test phù hợp | Chưa làm |
| 8 | Kiểm tra UI/flow nếu cần | Chưa làm |
| 9 | Cập nhật docs/checklist tiến độ | Chưa làm |
| 10 | Báo cáo kết quả và rủi ro còn lại | Chưa làm |
