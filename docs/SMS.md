Plan: Bắt buộc xác thực số điện thoại bằng SMS OTP
 Context

 Hệ thống SportLife đã có booking thật (Player đặt sân, Owner xác nhận). Checklist tiến độ role Chủ sân (docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md, dòng 564)
 liệt kê hạng mục ưu tiên Cao còn lại duy nhất: xác thực số điện thoại bằng SMS cho Player và Owner nhằm chống BOT/phá hoại (spam đặt sân giả) và đảm bảo Owner
 có SĐT thật để liên hệ.

 Yêu cầu của người dùng: bắt buộc cho mọi tài khoản (trừ Admin — Admin được miễn vì là tài khoản seed nội bộ, không tự đăng ký công khai).

 Quyết định đã chốt:
 - Provider: eSMS.vn / SpeedSMS (brandname) — phổ biến, giá rẻ tại VN. Thiết kế provider-agnostic với adapter console cho dev (giống email-service.ts).
 - Áp dụng: PLAYER + VENUE_OWNER bắt buộc; ADMIN miễn.
 - Thời điểm: một gate riêng sau login (redirect tới /verify-phone), tương tự cơ chế gate hoàn thiện profile hiện có.

 Hiện trạng codebase (đã đọc)

 - SĐT lưu trên PlayerProfile.phone và VenueOwnerProfile.phone (bắt buộc, regex ^\d{10}$, unique mỗi bảng). Admin không có profile → không có SĐT.
 - Không có middleware. Mọi gate enforce bằng redirect() server-side trong từng page. Ví dụ src/app/page.tsx redirect Player chưa có profile → /player/profile,
 Owner → /venue-owner/profile.
 - Mẫu xác thực email: VerificationToken (tokenHash sha256 trong DB, expiresAt, usedAt) + auth-service.ts + email-service.ts (adapter console cho dev). Helper
 token trong src/lib/auth/tokens.ts (generatePlainToken, hashToken, addMinutes, addHours).
 - Server action mẫu: auth-actions.ts dùng redirectWith(path, "error"|"status", value).

 Thiết kế

 Thứ tự gate (sau login)

 1. Login (NextAuth credentials — đã yêu cầu email verified + ACTIVE).
 2. Nếu thiếu profile → trang hoàn thiện profile (nhập phone). Giữ nguyên.
 3. MỚI: Nếu User.phoneVerifiedAt == null (và role ≠ ADMIN) → /verify-phone. Gửi OTP tới profile.phone, người dùng nhập mã 6 số.
 4. Verify xong → full access.

 Lý do verify đặt sau bước profile: SĐT được nhập trong form profile, nên cần có profile.phone trước khi gửi OTP.

 Lưu trữ

 - Thêm phoneVerifiedAt DateTime? trên model User (một cờ/ tài khoản, áp mọi role; Admin để null nhưng được guard bỏ qua).
 - Giữ giá trị phone ở profile như hiện tại (không nhân đôi).
 - Khi đổi phone trong profile → reset phoneVerifiedAt = null để bắt verify lại.

 Chống lạm dụng (mục tiêu chính: chống BOT)

 - Mã OTP 6 chữ số, lưu codeHash (sha256), hết hạn 5 phút.
 - Cooldown gửi lại: 60 giây; tối đa 5 lần gửi / giờ / user.
 - Tối đa 5 lần nhập sai mỗi mã → vô hiệu mã, buộc gửi lại.
 - Verify phía server (server action), không tin UI.

 Files

 Schema + migration

 - frontend/prisma/schema.prisma:
   - User: thêm phoneVerifiedAt DateTime? và relation phoneOtps PhoneVerificationOtp[].
   - Model mới PhoneVerificationOtp { id, userId, phone, codeHash, expiresAt, usedAt DateTime?, attemptCount Int @default(0), createdAt } + @@index([userId,
 expiresAt]), relation onDelete: Cascade. (Mẫu y hệt VerificationToken.)
 - Chạy npm run prisma:migrate (KHÔNG sửa tay migration state).

 SMS service (mới, mẫu theo email-service.ts)

 - frontend/src/lib/sms/sms-service.ts: export sendSms({ to, text }) với switch theo SMS_PROVIDER:
   - console (mặc định/dev): console.info("[sms:console]", { to, text }) — in OTP ra log.
   - esms: POST eSMS API (ESMS_API_KEY, ESMS_SECRET_KEY, ESMS_BRANDNAME).
   - speedsms: POST SpeedSMS API (SPEEDSMS_ACCESS_TOKEN, SPEEDSMS_SENDER).
   - Provider chưa cấu hình → throw rõ ràng (giống email-service).

 Tokens helper

 - frontend/src/lib/auth/tokens.ts: thêm generateOtpCode() → 6 chữ số ngẫu nhiên an toàn (crypto.randomInt(0, 1_000_000) pad 6). Tái dùng hashToken,
 addMinutes.

 Feature: phone verification

 - frontend/src/features/auth/phone-verification-service.ts:
   - requestPhoneOtp(userId): lấy profile.phone theo role; kiểm tra cooldown 60s + quota 5/giờ (đếm PhoneVerificationOtp theo createdAt); vô hiệu OTP cũ chưa
 dùng (usedAt = now); tạo OTP mới (codeHash, expiresAt +5'); sendSms. Trả trạng thái (cooldown/sent).
   - verifyPhoneOtp(userId, code): lấy OTP mới nhất chưa dùng/chưa hết hạn; nếu sai → attemptCount++, hết 5 lần → vô hiệu; nếu đúng → transaction set
 User.phoneVerifiedAt = now + usedAt = now.
   - userNeedsPhoneVerification(user): role !== ADMIN && !phoneVerifiedAt.
 - frontend/src/features/auth/phone-verification-actions.ts: requestPhoneOtpAction, verifyPhoneOtpAction — dùng mẫu redirectWith
 (/verify-phone?status=...|error=...).
 - frontend/src/features/auth/auth-schemas.ts: thêm phoneOtpSchema (code: regex ^\d{6}$).

 Gate page

 - frontend/src/app/verify-phone/page.tsx (Server Component):
   - auth(); chưa login → /login; ADMIN hoặc đã verified → /.
   - Nếu chưa có profile → redirect về trang profile (phải có phone trước).
   - Hiển thị SĐT đã che (vd 09****1234), form nhập OTP (verifyPhoneOtpAction), nút gửi lại (requestPhoneOtpAction), thông báo theo searchParams.
   - Lần đầu vào trang: nếu chưa có OTP hợp lệ trong vòng cooldown thì tự gửi (hoặc nút "Gửi mã" rõ ràng để tránh gửi ngoài ý muốn — chọn nút thủ công cho an
 toàn chi phí).

 Áp dụng gate (server-side, theo convention hiện có)

 - frontend/src/lib/authorization/phone-guard.ts (mới): getPhoneGateRedirect(user): string | null dùng chung.
 - Thêm check vào các chokepoint đang có gate profile:
   - src/app/page.tsx (gate trung tâm — sau check profile, thêm check phone).
   - src/app/venue-owner/page.tsx, các page src/app/player/*, src/app/venues/[venueId]/booking/*.
   - Defense-in-depth trong server action nhạy cảm: tạo booking (features/bookings), tạo match (features/matches), bắt đầu chat (features/chat) — chặn nếu
 userNeedsPhoneVerification.

 Profile services: reset khi đổi phone

 - frontend/src/features/player-profile/player-profile-service.ts và venue-owner-profile-service.ts: trong save..., nếu phone mới khác phone cũ → set
 User.phoneVerifiedAt = null (cùng transaction với upsert profile).

 Env

 - frontend/.env.example: thêm
 SMS_PROVIDER="console"
 ESMS_API_KEY=""
 ESMS_SECRET_KEY=""
 ESMS_BRANDNAME=""
 SPEEDSMS_ACCESS_TOKEN=""
 SPEEDSMS_SENDER=""

 Messages

 - frontend/src/features/auth/auth-messages.ts: thêm chuỗi tiếng Việt cho gửi mã / sai mã / hết hạn / quá số lần / cooldown.

 Tests

 - phone-verification-service: gửi tạo OTP + cooldown chặn gửi lại <60s; quota 5/giờ; verify sai tăng attempt và khóa sau 5 lần; verify đúng set
 phoneVerifiedAt; OTP hết hạn bị từ chối.

 - frontend/src/features/auth/auth-messages.ts: thêm chuỗi tiếng Việt cho gửi mã / sai mã / hết hạn / quá số lần / cooldown.

 Tests

 - phone-verification-service: gửi tạo OTP + cooldown chặn gửi lại <60s; quota 5/giờ; verify sai tăng attempt và khóa sau 5 lần; verify đúng set
 phoneVerifiedAt; OTP hết hạn bị từ chối.
  gate, profile phone). Không cần thêm explore — tôi đã đọc trực tiếp các file then chốt.

● Updated plan
  ⎿  /plan to preview

  Thought for 21s (ctrl+o to expand)

● Plan đã viết xong. Tóm tắt ngắn:

  - Thêm cờ User.phoneVerifiedAt + model PhoneVerificationOtp (mẫu y hệt VerificationToken).
  - SMS service provider-agnostic (console cho dev, esms/spedsms cho prod) — giống email-service.ts.
  - Gate riêng /verify-phone sau login, enforce bằng redirect() server-side theo đúng convention hiện có. Admin được miễn.
  - OTP 6 số, hết hạn 5 phút, cooldown 60s, quota 5/giờ, khóa sau 5 lần sai — để chống BOT.
  - Đổi phone trong profile → reset cờ, bắt verify lại.

● User approved Claude's plan
  ⎿  Plan saved to: C:\Users\duong\.claude\plans\jaunty-forging-feigenbaum.md · /plan to edit
     Plan: Bắt buộc xác thực số điện thoại bằng SMS OTP
     Context
     Hệ thống SportLife đã có booking thật (Player đặt sân, Owner xác nhận). Checklist tiến độ role Chủ sân (docs/VENUE_OWNER_FEATURE_DEVELOPMENT.md, dòng 564)
     liệt kê hạng mục ưu tiên Cao còn lại duy nhất: xác thực số điện thoại bằng SMS cho Player và Owner nhằm chống BOT/phá hoại (spam đặt sân giả) và đảm bảo
     Owner có SĐT thật để liên hệ.

     Yêu cầu của người dùng: bắt buộc cho mọi tài khoản (trừ Admin — Admin được miễn vì là tài khoản seed nội bộ, không tự đăng ký công khai).

     Quyết định đã chốt:
     - Provider: eSMS.vn / SpeedSMS (brandname) — phổ biến, giá rẻ tại VN. Thiết kế provider-agnostic với adapter console cho dev (giống email-service.ts).
     - Áp dụng: PLAYER + VENUE_OWNER bắt buộc; ADMIN miễn.
     - Thời điểm: một gate riêng sau login (redirect tới /verify-phone), tương tự cơ chế gate hoàn thiện profile hiện có.

     Hiện trạng codebase (đã đọc)

     - SĐT lưu trên PlayerProfile.phone và VenueOwnerProfile.phone (bắt buộc, regex ^\d{10}$, unique mỗi bảng). Admin không có profile → không có SĐT.
     - Không có middleware. Mọi gate enforce bằng redirect() server-side trong từng page. Ví dụ src/app/page.tsx redirect Player chưa có profile →
     /player/profile, Owner → /venue-owner/profile.
     - Mẫu xác thực email: VerificationToken (tokenHash sha256 trong DB, expiresAt, usedAt) + auth-service.ts + email-service.ts (adapter console cho dev).
     Helper token trong src/lib/auth/tokens.ts (generatePlainToken, hashToken, addMinutes, addHours).
     - Server action mẫu: auth-actions.ts dùng redirectWith(path, "error"|"status", value).

     Thiết kế

     Thứ tự gate (sau login)

     1. Login (NextAuth credentials — đã yêu cầu email verified + ACTIVE).
     2. Nếu thiếu profile → trang hoàn thiện profile (nhập phone). Giữ nguyên.
     3. MỚI: Nếu User.phoneVerifiedAt == null (và role ≠ ADMIN) → /verify-phone. Gửi OTP tới profile.phone, người dùng nhập mã 6 số.
     4. Verify xong → full access.

     Lý do verify đặt sau bước profile: SĐT được nhập trong form profile, nên cần có profile.phone trước khi gửi OTP.

     Lưu trữ

     - Thêm phoneVerifiedAt DateTime? trên model User (một cờ/ tài khoản, áp mọi role; Admin để null nhưng được guard bỏ qua).
     - Giữ giá trị phone ở profile như hiện tại (không nhân đôi).
     - Khi đổi phone trong profile → reset phoneVerifiedAt = null để bắt verify lại.

     Chống lạm dụng (mục tiêu chính: chống BOT)

     - Mã OTP 6 chữ số, lưu codeHash (sha256), hết hạn 5 phút.
     - Cooldown gửi lại: 60 giây; tối đa 5 lần gửi / giờ / user.
     - Tối đa 5 lần nhập sai mỗi mã → vô hiệu mã, buộc gửi lại.
     - Verify phía server (server action), không tin UI.

     Files

     Schema + migration

     - frontend/prisma/schema.prisma:
       - User: thêm phoneVerifiedAt DateTime? và relation phoneOtps PhoneVerificationOtp[].
       - Model mới PhoneVerificationOtp { id, userId, phone, codeHash, expiresAt, usedAt DateTime?, attemptCount Int @default(0), createdAt } + @@index([userId,     expiresAt]), relation onDelete: Cascade. (Mẫu y hệt VerificationToken.)
     - Chạy npm run prisma:migrate (KHÔNG sửa tay migration state).

     SMS service (mới, mẫu theo email-service.ts)

     - frontend/src/lib/sms/sms-service.ts: export sendSms({ to, text }) với switch theo SMS_PROVIDER:
       - console (mặc định/dev): console.info("[sms:console]", { to, text }) — in OTP ra log.
       - esms: POST eSMS API (ESMS_API_KEY, ESMS_SECRET_KEY, ESMS_BRANDNAME).
       - speedsms: POST SpeedSMS API (SPEEDSMS_ACCESS_TOKEN, SPEEDSMS_SENDER).
       - Provider chưa cấu hình → throw rõ ràng (giống email-service).

     Tokens helper

     - frontend/src/lib/auth/tokens.ts: thêm generateOtpCode() → 6 chữ số ngẫu nhiên an toàn (crypto.randomInt(0, 1_000_000) pad 6). Tái dùng hashToken,
     addMinutes.

     Feature: phone verification

     - frontend/src/features/auth/phone-verification-service.ts:
       - requestPhoneOtp(userId): lấy profile.phone theo role; kiểm tra cooldown 60s + quota 5/giờ (đếm PhoneVerificationOtp theo createdAt); vô hiệu OTP cũ
     chưa dùng (usedAt = now); tạo OTP mới (codeHash, expiresAt +5'); sendSms. Trả trạng thái (cooldown/sent).
       - verifyPhoneOtp(userId, code): lấy OTP mới nhất chưa dùng/chưa hết hạn; nếu sai → attemptCount++, hết 5 lần → vô hiệu; nếu đúng → transaction set
     User.phoneVerifiedAt = now + usedAt = now.
       - userNeedsPhoneVerification(user): role !== ADMIN && !phoneVerifiedAt.
     - frontend/src/features/auth/phone-verification-actions.ts: requestPhoneOtpAction, verifyPhoneOtpAction — dùng mẫu redirectWith
     (/verify-phone?status=...|error=...).
     - frontend/src/features/auth/auth-schemas.ts: thêm phoneOtpSchema (code: regex ^\d{6}$).

     Gate page

     - frontend/src/app/verify-phone/page.tsx (Server Component):
       - auth(); chưa login → /login; ADMIN hoặc đã verified → /.
       - Nếu chưa có profile → redirect về trang profile (phải có phone trước).
       - Hiển thị SĐT đã che (vd 09****1234), form nhập OTP (verifyPhoneOtpAction), nút gửi lại (requestPhoneOtpAction), thông báo theo searchParams.
       - Lần đầu vào trang: nếu chưa có OTP hợp lệ trong vòng cooldown thì tự gửi (hoặc nút "Gửi mã" rõ ràng để tránh gửi ngoài ý muốn — chọn nút thủ công cho
     an toàn chi phí).

     Áp dụng gate (server-side, theo convention hiện có)

     - frontend/src/lib/authorization/phone-guard.ts (mới): getPhoneGateRedirect(user): string | null dùng chung.
     - Thêm check vào các chokepoint đang có gate profile:
       - src/app/page.tsx (gate trung tâm — sau check profile, thêm check phone).
       - src/app/venue-owner/page.tsx, các page src/app/player/*, src/app/venues/[venueId]/booking/*.
       - Defense-in-depth trong server action nhạy cảm: tạo booking (features/bookings), tạo match (features/matches), bắt đầu chat (features/chat) — chặn nếu
     userNeedsPhoneVerification.

     Profile services: reset khi đổi phone

     - frontend/src/features/player-profile/player-profile-service.ts và venue-owner-profile-service.ts: trong save..., nếu phone mới khác phone cũ → set
     User.phoneVerifiedAt = null (cùng transaction với upsert profile).

     Env

     - frontend/.env.example: thêm
     SMS_PROVIDER="console"
     ESMS_API_KEY=""
     ESMS_SECRET_KEY=""
     ESMS_BRANDNAME=""
     SPEEDSMS_ACCESS_TOKEN=""
     SPEEDSMS_SENDER=""

     Messages

     - frontend/src/features/auth/auth-messages.ts: thêm chuỗi tiếng Việt cho gửi mã / sai mã / hết hạn / quá số lần / cooldown.

     Tests

     - phone-verification-service: gửi tạo OTP + cooldown chặn gửi lại <60s; quota 5/giờ; verify sai tăng attempt và khóa sau 5 lần; verify đúng set
     phoneVerifiedAt; OTP hết hạn bị từ chối.
     - Guard: Player/Owner chưa verified bị redirect /verify-phone; Admin không bị; đã verified qua được.
     - Profile: đổi phone reset phoneVerifiedAt.

     Verification (end-to-end)

     1. docker compose up --build từ repo root (hoặc npm run dev trong frontend/), SMS_PROVIDER=console.
     2. Đăng ký Player → verify email → login → hoàn thiện profile (nhập phone) → bị đẩy tới /verify-phone.
     3. Bấm gửi mã → đọc OTP trong log [sms:console] → nhập đúng → vào được /venues. Nhập sai 5 lần → mã bị khóa, phải gửi lại. Thử resend <60s → bị cooldown.
     4. Lặp với Venue Owner. Login Admin → KHÔNG bị gate.
     5. Đổi phone trong profile → bị bắt verify lại.
     6. npm run lint + npm run test.

       7 tasks (5 done, 1 in progress, 1 open)
  ◼ Áp dụng gate vào chokepoints + reset khi đổi phone
  ◻ Env example + messages + tests
  ✔ Schema: thêm phoneVerifiedAt + PhoneVerificationOtp
  ✔ SMS service provider-agnostic
  ✔ Tokens helper: generateOtpCode
   … +2 completed