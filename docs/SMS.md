# SMS OTP — SportLife

## Provider đã chọn

**UniMatrix** (`https://www.unimtx.com`) — provider chính thức.

- Không cần đăng ký brandname hay giấy phép kinh doanh (GPKD).
- Đăng ký tài khoản miễn phí, có free trial credits.
- Hỗ trợ gửi SMS tới 230+ quốc gia, bao gồm Việt Nam.
- Đã dùng thành công trong project PRN222 ApartmentManagement.

## So sánh các provider đã đánh giá

| Tiêu chí | eSMS | SpeedSMS | Zalo ZNS | UniMatrix (hiện tại) |
|---|---|---|---|---|
| Cần GPKD | ✅ | ❌ | ✅ | ❌ |
| Cần đăng ký brandname | ✅ | ❌ (có mặc định) | N/A | ❌ |
| Free trial | ❌ | ❌ | ❌ | ✅ |
| Phù hợp dự án SV | ❌ | ✅ | ❌ | ✅ |
| Đã test thực tế | ✅ | ❌ | ❌ | ✅ (PRN222) |

## Cách đăng ký (thực hiện 1 lần)

1. Truy cập [unimtx.com/signup](https://www.unimtx.com/signup) → đăng ký tài khoản.
2. Vào **Console → Credentials** → copy **Access Key ID**.
3. Điền vào `.env.local`:
   ```
   SMS_PROVIDER=unimtx
   UNIMTX_ACCESS_KEY_ID=<access key id vừa copy>
   ```

## Thiết kế adapter (provider-agnostic)

File: `frontend/src/lib/sms/sms-service.ts`

```
SMS_PROVIDER=console    → in OTP ra log (dev/test)
SMS_PROVIDER=unimtx     → gửi SMS thật qua UniMatrix
```

## API Reference

- **Endpoint:** `POST https://api.unimtx.com/?action=sms.message.send&accessKeyId=...`
- **Body:** `{ "to": "+84XXXXXXXXX", "text": "Ma xac thuc SportLife: 123456" }`
- **Success:** `{ "code": "0", "message": "Success" }`
- **Error:** `{ "code": "<error_code>", "message": "<error_description>" }`
- **Docs:** https://www.unimtx.com/docs/api/send
- **C# Reference:** `PRN222_ApartmentManagement/Utils/UniMatrixHelper.cs`

## Env vars

```env
SMS_PROVIDER="console"
UNIMTX_ACCESS_KEY_ID=""
UNIMTX_ACCESS_KEY_SECRET=""   # optional — cho HMAC Mode (bảo mật hơn)
```

## Gate xác thực SĐT

Thứ tự sau login:
1. Kiểm tra email verified → nếu chưa: redirect `/verify-email`
2. Kiểm tra profile đầy đủ → nếu chưa: redirect `/player/profile` hoặc `/venue-owner/profile`
3. **Kiểm tra `User.phoneVerifiedAt`** → nếu null và role ≠ ADMIN: redirect `/verify-phone`
4. Full access

Admin không bị gate SĐT (tài khoản seed nội bộ).

## Chống lạm dụng

- OTP 6 chữ số, lưu codeHash (sha256), hết hạn 5 phút
- Cooldown gửi lại: 60 giây
- Quota: tối đa 5 lần gửi / giờ / user
- Tối đa 5 lần nhập sai → vô hiệu mã, buộc gửi lại
- Đổi SĐT trong profile → reset `phoneVerifiedAt = null`

## Kiểm tra manual

```bash
# Dev: đọc OTP trong log
SMS_PROVIDER=console npm run dev

# Prod: SMS thật
SMS_PROVIDER=unimtx
UNIMTX_ACCESS_KEY_ID=<access_key_id>
```