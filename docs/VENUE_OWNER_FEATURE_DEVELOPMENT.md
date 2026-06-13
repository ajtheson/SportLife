# Phát triển chức năng cho Role Chủ sân

Tài liệu này mô tả hiện trạng và định hướng phát triển các chức năng dành cho **Chủ sân** trong SportLife. Phần đầu ghi nhận những chức năng đã có trong hệ thống hiện tại. Phần sau tập trung vào các chức năng mới, thực sự phục vụ vận hành và quản lý sân như: đặt sân trực tiếp, quản lý lịch trống sân, chat với Player và cập nhật trạng thái sân theo thời gian thực hoặc theo lịch đặt.

## 1. Mục tiêu sản phẩm cho role Chủ sân

Chủ sân không chỉ cần đăng thông tin sân để Player xem và liên hệ, mà cần một workspace vận hành đủ hữu ích để quản lý hoạt động hằng ngày.

Mục tiêu phát triển tiếp theo:

- Cho phép Player đặt sân trực tiếp trong hệ thống.
- Cho phép Chủ sân quản lý lịch trống, lịch đã đặt và trạng thái từng sân/khung giờ.
- Cho phép Chủ sân và Player chat qua lại trong bối cảnh venue hoặc booking.
- Cập nhật trạng thái trống sân theo thời gian thực hoặc theo dữ liệu đặt lịch.
- Giảm phụ thuộc vào việc Player phải gọi điện/nhắn ngoài hệ thống.
- Giúp Chủ sân nhìn nhanh hôm nay sân nào trống, sân nào đã được đặt, booking nào cần xác nhận.

Ghi chú scope:

- Các chức năng đặt sân, quản lý lịch trống chi tiết và thanh toán đang nằm ngoài scope SRS v1.0.0 ban đầu.
- Nếu triển khai các chức năng này, cần xem như scope mở rộng sau v1.0.0 hoặc cập nhật SRS/implementation plan tương ứng.
- Có thể triển khai đặt sân trước nhưng chưa cần thanh toán online. Thanh toán có thể để giai đoạn sau.

## 2. Các chức năng đã làm cho Chủ sân

### 2.1 Đăng ký, xác minh email và đăng nhập

Trạng thái: **Đã hoàn thành**

Chức năng đã có:

- Guest có thể đăng ký tài khoản với vai trò `Venue Owner`.
- Hệ thống gửi email xác minh sau khi đăng ký.
- Chủ sân phải xác minh email trước khi dùng các chức năng cần đăng nhập.
- Chủ sân có thể đăng nhập, đăng xuất, quên mật khẩu và đặt lại mật khẩu.
- Nếu email đã tồn tại nhưng tài khoản còn active và chưa xác minh, hệ thống gửi lại email xác minh mới thay vì chặn đăng ký.
- Admin không thể tự đăng ký công khai.

Module/code liên quan:

- `frontend/src/features/auth`
- `frontend/src/app/register`
- `frontend/src/app/login`
- `frontend/src/app/verify-email`
- `frontend/src/app/forgot-password`
- `frontend/src/app/reset-password`

### 2.2 Hồ sơ Chủ sân

Trạng thái: **Đã hoàn thành**

Chức năng đã có:

- Chủ sân được yêu cầu hoàn thiện `VenueOwnerProfile` trước khi quản lý sân.
- Hồ sơ Chủ sân lưu thông tin liên hệ chính.
- Số điện thoại Chủ sân bắt buộc đúng 10 chữ số.
- Số điện thoại Chủ sân là duy nhất giữa các hồ sơ Chủ sân.
- Chỉ user có role `VENUE_OWNER` mới được tạo/cập nhật hồ sơ Chủ sân.
- Một tài khoản Chủ sân chỉ có tối đa một hồ sơ Chủ sân.

Module/code liên quan:

- `frontend/src/features/venue-owner-profile`
- `frontend/src/app/venue-owner/profile`
- `frontend/src/app/venue-owner`

### 2.3 Tạo và quản lý thông tin venue

Trạng thái: **Đã hoàn thành**

Chức năng đã có:

- Chủ sân có thể tạo venue mới từ workspace của mình.
- Venue có các thông tin chính: tên sân, khu vực, địa chỉ chi tiết, số điện thoại liên hệ, môn thể thao, ghi chú khả dụng, giờ mở cửa, giá tham khảo, mô tả và hình ảnh.
- Mỗi venue chọn đúng một môn thể thao.
- Số điện thoại liên hệ của venue bắt buộc đúng 10 chữ số.
- Khu vực chọn theo dữ liệu phường/xã Hà Nội.
- Venue mới được tạo với trạng thái `PENDING_APPROVAL`.
- Chủ sân có thể chỉnh sửa venue do mình sở hữu.
- Khi chỉnh sửa venue đã được duyệt, venue quay lại `PENDING_APPROVAL`.
- Venue pending/rejected không hiển thị trong danh sách khám phá công khai của Player.

Module/code liên quan:

- `frontend/src/features/venues`
- `frontend/src/app/venue-owner`
- `frontend/src/app/venue-owner/venues/new`
- `frontend/src/app/venue-owner/venues/[venueId]/edit`

### 2.4 Upload ảnh venue

Trạng thái: **Đã hoàn thành**

Chức năng đã có:

- Chủ sân có thể upload ảnh khi tạo hoặc chỉnh sửa venue.
- Hệ thống chấp nhận ảnh JPG, PNG hoặc WEBP.
- Mỗi venue có tối đa 5 ảnh.
- Mỗi ảnh tối đa 5MB.
- Ở môi trường local, file được lưu trong `frontend/public/uploads/venues/`.
- PostgreSQL chỉ lưu URL ảnh, không lưu trực tiếp file ảnh.

Module/code liên quan:

- `frontend/src/lib/storage/storage-service.ts`
- `frontend/src/features/venues`
- `frontend/public/uploads/`

### 2.5 Theo dõi trạng thái duyệt venue

Trạng thái: **Đã hoàn thành**

Chức năng đã có:

- Chủ sân xem được trạng thái duyệt của từng venue.
- Admin có thể duyệt hoặc từ chối venue.
- Nếu venue bị từ chối, Chủ sân thấy được lý do từ chối.
- Venue được duyệt và đang active mới xuất hiện trong venue discovery.
- Admin có thể ẩn hoặc khôi phục venue theo luồng quản trị.

Trạng thái chính:

- `PENDING_APPROVAL`: đang chờ Admin duyệt.
- `APPROVED`: đã được duyệt.
- `REJECTED`: bị từ chối.
- `ACTIVE`: đang hoạt động.
- `HIDDEN`: bị ẩn khỏi trang công khai.

### 2.6 Chat Player - Chủ sân từ venue đã duyệt

Trạng thái: **Đã hoàn thành ở mức cơ bản**

Chức năng đã có:

- Player có thể bắt đầu chat với Chủ sân từ trang chi tiết venue đã được duyệt và đang active.
- Chủ sân có thể xem danh sách hội thoại và trả lời tin nhắn.
- Chat là hội thoại trực tiếp 1:1.
- Một cặp user trực tiếp chỉ có tối đa một conversation.
- Tin nhắn chỉ hỗ trợ text trong v1.0.0.
- Nội dung tin nhắn tối đa 1000 ký tự.
- Admin không tham gia chat.
- Hệ thống kiểm tra quyền thành viên conversation ở server-side.

Điểm còn thiếu nếu muốn phục vụ vận hành booking:

- Chat chưa gắn trực tiếp với một booking cụ thể.
- Chưa có trạng thái đã đọc/chưa đọc rõ ràng theo conversation.
- Chưa realtime; phiên bản hiện tại dùng server actions/page refresh.
- Chưa có quick reply hoặc mẫu phản hồi nhanh cho Chủ sân.

Module/code liên quan:

- `frontend/src/features/chat`
- `frontend/src/app/chat`
- `frontend/src/app/chat/[conversationId]`
- `frontend/src/app/venues/[venueId]`

### 2.7 Thông báo trong ứng dụng

Trạng thái: **Đã hoàn thành ở mức cơ bản**

Chức năng đã có:

- Khi có tin nhắn mới, hệ thống tạo notification in-app cho người nhận.
- Chủ sân có thể xem thông báo trong màn hình notifications.
- Notification được lưu trong PostgreSQL.

Module/code liên quan:

- `frontend/src/features/notifications`
- `frontend/src/app/notifications`

## 3. Chức năng mới ưu tiên phát triển cho Chủ sân

Nhóm này là phần quan trọng nhất cho giai đoạn phát triển tiếp theo. Các mục được sắp theo độ ưu tiên sản phẩm, không chỉ là cải thiện giao diện.

### 3.1 Quản lý trạng thái trống sân theo lịch

Mức ưu tiên: **Rất cao - làm trước**

Mục tiêu:

- Chủ sân quản lý được từng sân con/court/table trong một venue.
- Chủ sân biết khung giờ nào còn trống, khung giờ nào đã được đặt, khung giờ nào bị khóa.
- Player xem được trạng thái trống sân trước khi gửi yêu cầu đặt.

Chức năng đề xuất:

- Cho phép Chủ sân khai báo danh sách sân con trong venue, ví dụ: Sân 1, Sân 2, Bàn 3, Court A.
- Thiết lập khung giờ hoạt động theo ngày trong tuần.
- Thiết lập độ dài slot, ví dụ 30 phút, 60 phút, 90 phút hoặc 120 phút.
- Hiển thị lịch dạng ngày/tuần cho Chủ sân.
- Đánh dấu slot theo trạng thái:
  - `AVAILABLE`: còn trống.
  - `HELD`: đang được giữ tạm trong quá trình Player đặt.
  - `PENDING_CONFIRMATION`: chờ Chủ sân xác nhận.
  - `BOOKED`: đã được đặt.
  - `BLOCKED`: Chủ sân khóa vì bảo trì, nghỉ lễ hoặc lý do riêng.
  - `CANCELED`: đã hủy.
- Cho phép Chủ sân tự khóa/mở slot thủ công.
- Cho phép cập nhật trạng thái trống sân theo lịch đặt thay vì chỉ nhập ghi chú text.

Luồng Chủ sân:

1. Chủ sân vào trang quản lý lịch của một venue.
2. Chủ sân tạo danh sách sân con.
3. Chủ sân cấu hình giờ mở cửa và độ dài slot.
4. Hệ thống sinh lịch trống theo ngày/tuần.
5. Khi có booking, slot đổi trạng thái tương ứng.
6. Chủ sân có thể khóa slot nếu sân bận hoặc bảo trì.

Gợi ý data model:

- `VenueResource`: sân con/court/table thuộc một venue.
- `VenueScheduleRule`: rule giờ hoạt động theo ngày trong tuần.
- `VenueTimeSlot`: slot cụ thể theo ngày/giờ, có trạng thái.
- `VenueBlackout`: khoảng thời gian Chủ sân khóa thủ công.

Routes gợi ý:

- `/venue-owner/venues/[venueId]/schedule`
- `/venue-owner/venues/[venueId]/resources`
- `/venues/[venueId]/availability`

Tiêu chí nghiệm thu:

- Chủ sân tạo được sân con cho venue.
- Chủ sân cấu hình được giờ hoạt động và độ dài slot.
- Hệ thống hiển thị được lịch trống/bận theo ngày.
- Chủ sân khóa/mở được slot thủ công.
- Player chỉ thấy các slot có thể đặt.

### 3.2 Đặt sân trực tiếp trong hệ thống

Mức ưu tiên: **Rất cao - làm ngay sau quản lý lịch trống**

Mục tiêu:

- Player có thể đặt sân trực tiếp trên SportLife thay vì chỉ xem số điện thoại rồi liên hệ ngoài hệ thống.
- Chủ sân có dashboard để nhận, xác nhận hoặc từ chối yêu cầu đặt sân.
- Lịch trống sân được cập nhật theo booking.

Chức năng đề xuất cho Player:

- Chọn venue đã approved/active.
- Chọn sân con nếu venue có nhiều sân.
- Chọn ngày và khung giờ còn trống.
- Nhập ghi chú đặt sân nếu cần.
- Gửi yêu cầu đặt sân.
- Theo dõi trạng thái booking.
- Hủy yêu cầu đặt sân theo rule thời gian.

Chức năng đề xuất cho Chủ sân:

- Xem danh sách booking theo ngày, venue, sân con và trạng thái.
- Xác nhận booking.
- Từ chối booking kèm lý do.
- Hủy booking nếu có lý do vận hành.
- Ghi chú nội bộ cho booking.
- Mở chat với Player trong bối cảnh booking.

Trạng thái booking đề xuất:

- `PENDING`: Player vừa gửi yêu cầu.
- `CONFIRMED`: Chủ sân đã xác nhận.
- `REJECTED`: Chủ sân từ chối.
- `CANCELED_BY_PLAYER`: Player hủy.
- `CANCELED_BY_OWNER`: Chủ sân hủy.
- `COMPLETED`: booking đã qua và được đóng.
- `NO_SHOW`: Player không đến, nếu sau này cần theo dõi.

Luồng booking cơ bản:

1. Player xem lịch trống của venue.
2. Player chọn slot và gửi yêu cầu đặt sân.
3. Hệ thống giữ slot ở trạng thái `PENDING_CONFIRMATION` hoặc `HELD`.
4. Chủ sân nhận notification.
5. Chủ sân xác nhận hoặc từ chối.
6. Nếu xác nhận, slot chuyển thành `BOOKED`.
7. Nếu từ chối/hủy, slot có thể quay lại `AVAILABLE`.

Gợi ý data model:

- `Booking`: yêu cầu đặt sân chính.
- `BookingSlot`: slot hoặc khoảng thời gian được đặt.
- `BookingStatusHistory`: lịch sử đổi trạng thái booking.
- `BookingNote`: ghi chú hoặc lý do từ chối/hủy.

Routes gợi ý:

- `/venues/[venueId]/booking/new`
- `/player/bookings`
- `/venue-owner/bookings`
- `/venue-owner/bookings/[bookingId]`

Tiêu chí nghiệm thu:

- Player tạo được booking từ slot trống.
- Một slot không bị double-book khi đã có booking confirmed/pending hợp lệ.
- Chủ sân xác nhận/từ chối được booking.
- Booking đổi trạng thái đúng rule.
- Lịch trống sân cập nhật sau khi booking đổi trạng thái.
- Player và Chủ sân đều thấy trạng thái booking mới nhất.

### 3.3 Cập nhật trạng thái trống sân realtime hoặc gần realtime

Mức ưu tiên: **Cao - ưu tiên sau khi có booking và schedule nền tảng**

Mục tiêu:

- Player và Chủ sân nhìn thấy trạng thái sân mới nhất mà không phải reload thủ công quá nhiều.
- Giảm rủi ro hai Player cùng đặt một slot.

Phương án triển khai theo giai đoạn:

Giai đoạn 1 - Theo lịch đặt, chưa realtime hoàn toàn:

- Mỗi lần booking được tạo/xác nhận/hủy, hệ thống cập nhật slot trong database.
- UI reload hoặc revalidate dữ liệu sau mutation.
- Dễ triển khai, phù hợp làm trước.

Giai đoạn 2 - Polling nhẹ:

- Trang lịch của Chủ sân và Player tự refresh mỗi 15-30 giây.
- Hiển thị cảnh báo nếu slot vừa thay đổi trạng thái.
- Không cần WebSocket ngay.

Giai đoạn 3 - Realtime:

- Dùng WebSocket, Server-Sent Events hoặc dịch vụ realtime.
- Khi Chủ sân xác nhận booking, Player đang xem slot nhận cập nhật ngay.
- Khi Player tạo booking, Chủ sân nhận cập nhật ngay trên dashboard.

Tiêu chí nghiệm thu:

- Slot đổi trạng thái ngay sau khi booking thay đổi.
- Người dùng không thể đặt slot đã bị người khác giữ/đặt.
- Chủ sân nhìn thấy booking mới trong dashboard mà không cần thao tác phức tạp.
- Có xử lý race condition bằng transaction hoặc constraint ở database.

### 3.4 Chat Player - Chủ sân gắn với booking

Mức ưu tiên: **Cao**

Mục tiêu:

- Chat không chỉ là liên hệ chung từ venue, mà có thể gắn với một booking cụ thể.
- Chủ sân và Player trao đổi rõ về giờ đặt, sân con, thay đổi lịch hoặc lý do hủy.

Chức năng đề xuất:

- Cho phép mở chat từ chi tiết booking.
- Hiển thị context booking trong màn hình chat: venue, sân con, ngày, giờ, trạng thái.
- Cho phép Chủ sân gửi phản hồi nhanh, ví dụ:
  - Xác nhận lịch đặt.
  - Đề xuất khung giờ khác.
  - Yêu cầu Player đến sớm.
  - Thông báo sân đang bảo trì.
- Notification khi có tin nhắn mới trong booking conversation.
- Gắn conversation với `bookingId` nếu cần phân biệt từng booking.

Gợi ý data model:

- Bổ sung `bookingContextId` vào `Conversation` hoặc tạo bảng liên kết conversation-booking.
- Có thể giữ một conversation theo cặp user và hiển thị booking context trong message/thread, nhưng cần thiết kế kỹ để tránh lẫn nhiều booking.

Tiêu chí nghiệm thu:

- Player mở chat được từ booking của mình.
- Chủ sân mở chat được từ booking thuộc venue của mình.
- Chat hiển thị thông tin booking liên quan.
- User ngoài booking không truy cập được conversation.

### 3.5 Dashboard vận hành booking cho Chủ sân

Mức ưu tiên: **Cao**

Mục tiêu:

- Chủ sân có một màn hình làm việc hằng ngày, không chỉ là danh sách venue.

Chức năng đề xuất:

- Hiển thị booking hôm nay.
- Hiển thị booking đang chờ xác nhận.
- Hiển thị slot sắp tới trong 2-4 giờ tới.
- Hiển thị venue/sân con đang trống hiện tại.
- Bộ lọc theo venue, ngày, trạng thái booking.
- Quick actions: xác nhận, từ chối, nhắn Player, khóa slot.

Routes gợi ý:

- `/venue-owner/dashboard`
- `/venue-owner/bookings`
- `/venue-owner/calendar`

Tiêu chí nghiệm thu:

- Chủ sân thấy được các booking cần xử lý ngay.
- Chủ sân xác nhận/từ chối booking ngay từ dashboard.
- Chủ sân chuyển nhanh sang chat hoặc lịch sân.

## 4. Các cải thiện nên làm sau

Nhóm này vẫn hữu ích, nhưng ưu tiên thấp hơn so với booking, lịch trống và realtime availability.

### 4.1 Bộ lọc và phân trang danh sách venue

Mức ưu tiên: **Trung bình**

- Lọc venue theo trạng thái duyệt.
- Lọc venue theo trạng thái hiển thị.
- Tìm kiếm venue theo tên hoặc khu vực.
- Phân trang danh sách venue khi số lượng lớn.

### 4.2 Lịch sử duyệt và ghi chú phản hồi từ Admin

Mức ưu tiên: **Trung bình**

- Lưu lịch sử các lần duyệt/từ chối venue.
- Hiển thị thời điểm duyệt, người duyệt và lý do từ chối.
- Cho phép Chủ sân xem lịch sử chỉnh sửa/gửi duyệt lại.

### 4.3 Cải thiện quản lý ảnh venue

Mức ưu tiên: **Trung bình**

- Cho phép xóa từng ảnh thay vì thay toàn bộ danh sách ảnh.
- Cho phép sắp xếp thứ tự ảnh.
- Chọn ảnh đại diện cho venue.
- Hiển thị preview ảnh rõ hơn trước khi lưu.

### 4.4 Thống kê tương tác cơ bản

Mức ưu tiên: **Thấp đến Trung bình**

- Đếm số lượt xem chi tiết venue.
- Đếm số lượt Player bắt đầu chat từ venue.
- Hiển thị thống kê theo từng venue.

## 5. Luồng nghiệp vụ mục tiêu

### 5.1 Luồng cấu hình lịch trống sân

1. Chủ sân tạo hoặc chọn venue đã được duyệt.
2. Chủ sân khai báo các sân con trong venue.
3. Chủ sân cấu hình giờ hoạt động theo ngày trong tuần.
4. Chủ sân chọn độ dài slot mặc định.
5. Hệ thống sinh lịch trống theo cấu hình.
6. Chủ sân khóa các slot đặc biệt nếu sân bận, bảo trì hoặc nghỉ lễ.
7. Player xem được các slot còn trống trên trang venue.

### 5.2 Luồng Player đặt sân

1. Player mở trang chi tiết venue.
2. Player chọn ngày, sân con và khung giờ còn trống.
3. Player gửi yêu cầu đặt sân.
4. Hệ thống tạo booking và giữ slot.
5. Chủ sân nhận notification.
6. Chủ sân xác nhận hoặc từ chối booking.
7. Player nhận notification về kết quả.
8. Nếu cần, hai bên chat để trao đổi thêm.

### 5.3 Luồng Chủ sân xử lý booking trong ngày

1. Chủ sân mở dashboard vận hành.
2. Chủ sân xem booking hôm nay và booking chờ xác nhận.
3. Chủ sân xác nhận/từ chối nhanh từng booking.
4. Chủ sân xem slot còn trống trong ngày.
5. Chủ sân khóa slot phát sinh nếu sân có việc đột xuất.
6. Hệ thống cập nhật trạng thái trống sân cho Player.

## 6. Data model đề xuất cho giai đoạn booking

Các model hiện có cần tái sử dụng:

- `User`: Player, Venue Owner, Admin.
- `VenueOwnerProfile`: hồ sơ Chủ sân.
- `Venue`: venue do Chủ sân quản lý.
- `VenueImage`: ảnh venue.
- `Conversation`: hội thoại trực tiếp.
- `ChatMessage`: tin nhắn.
- `Notification`: thông báo trong ứng dụng.

Các model mới đề xuất:

- `VenueResource`: sân con/court/table thuộc venue.
- `VenueScheduleRule`: giờ hoạt động mặc định theo ngày trong tuần.
- `VenueTimeSlot`: slot cụ thể được sinh theo ngày/giờ.
- `VenueBlackout`: khoảng thời gian bị Chủ sân khóa thủ công.
- `Booking`: yêu cầu đặt sân.
- `BookingSlot`: slot hoặc khoảng thời gian được booking sử dụng.
- `BookingStatusHistory`: lịch sử đổi trạng thái booking.
- `BookingNote`: ghi chú hoặc lý do hủy/từ chối.

Enum đề xuất:

- `VenueResourceStatus`: `ACTIVE`, `INACTIVE`, `MAINTENANCE`.
- `TimeSlotStatus`: `AVAILABLE`, `HELD`, `PENDING_CONFIRMATION`, `BOOKED`, `BLOCKED`, `CANCELED`.
- `BookingStatus`: `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELED_BY_PLAYER`, `CANCELED_BY_OWNER`, `COMPLETED`, `NO_SHOW`.

## 7. Validation và authorization cần có

Validation:

- Booking chỉ được tạo cho venue `APPROVED` và `ACTIVE`.
- Booking chỉ được tạo cho slot còn trống hoặc có thể giữ tạm.
- Một slot không được double-book.
- Thời gian bắt đầu booking phải ở tương lai.
- Thời lượng booking phải khớp rule slot hoặc rule venue.
- Chủ sân phải nhập lý do khi từ chối/hủy booking nếu rule yêu cầu.
- Tin nhắn chat không rỗng và không vượt quá giới hạn ký tự.

Authorization:

- Player chỉ được tạo booking cho chính mình.
- Player chỉ được xem/sửa/hủy booking của mình theo rule.
- Chủ sân chỉ được quản lý booking thuộc venue mình sở hữu.
- Chủ sân chỉ được cấu hình lịch cho venue mình sở hữu.
- Admin có thể xem hoặc can thiệp booking nếu sau này có yêu cầu quản trị.
- Chat booking chỉ mở cho Player đặt sâ
n và Chủ sân sở hữu venue.

Concurrency/race condition:

- Cần transaction khi tạo booking và cập nhật slot.
- Cần unique constraint hoặc kiểm tra DB để tránh hai booking cùng chiếm một slot.
- Nếu dùng trạng thái `HELD`, cần cơ chế hết hạn giữ slot.

## 8. Checklist tiến độ

| Nhóm chức năng | Hạng mục | Trạng thái | Ưu tiên | Ghi chú |
| --- | --- | --- | --- | --- |
| Auth | Đăng ký role Chủ sân | Đã hoàn thành | Đã xong | Public registration hỗ trợ `Venue Owner` |
| Auth | Xác minh email | Đã hoàn thành | Đã xong | Bắt buộc trước khi dùng chức năng authenticated |
| Auth | Đăng nhập/đăng xuất | Đã hoàn thành | Đã xong | Dùng Auth.js/NextAuth |
| Hồ sơ | Tạo/cập nhật hồ sơ Chủ sân | Đã hoàn thành | Đã xong | Qua `VenueOwnerProfile` |
| Venue | Tạo venue mới | Đã hoàn thành | Đã xong | Venue bắt đầu ở `PENDING_APPROVAL` |
| Venue | Chỉnh sửa venue | Đã hoàn thành | Đã xong | Có kiểm tra ownership |
| Venue | Upload ảnh venue | Đã hoàn thành | Đã xong | JPG/PNG/WEBP, tối đa 5 ảnh, 5MB/ảnh |
| Venue | Chủ sân xem trạng thái duyệt | Đã hoàn thành | Đã xong | Có pending/approved/rejected |
| Chat | Player chat với Chủ sân từ venue approved/active | Đã hoàn thành cơ bản | Cao | Cần nâng cấp để gắn với booking |
| Notification | Thông báo khi có tin nhắn mới | Đã hoàn thành cơ bản | Cao | Cần thêm notification booking |
| Lịch sân | Khai báo sân con/court/table trong venue | Đã hoàn thành | Rất cao | Qua `/venue-owner/venues/[venueId]/schedule` |
| Lịch sân | Cấu hình giờ hoạt động theo ngày | Đã hoàn thành | Rất cao | Lưu rule theo ngày trong tuần, đồng bộ tóm tắt giờ mở cửa |
| Lịch sân | Sinh slot trống theo lịch | Đã hoàn thành | Rất cao | Sinh slot theo ngày cho các sân con active, tránh tạo trùng slot |
| Lịch sân | Chủ sân khóa/mở slot thủ công | Đã hoàn thành | Rất cao | Hỗ trợ khóa slot trống và mở lại slot đã khóa |
| Availability | Cập nhật trạng thái trống sân theo booking | Đã hoàn thành | Rất cao | Slot đồng bộ theo booking, atomic claim chống double-book |
| Booking | Player đặt sân trực tiếp | Đã hoàn thành | Rất cao | Qua `/venues/[venueId]/booking`, chưa cần thanh toán online |
| Booking | Chủ sân xác nhận/từ chối booking | Đã hoàn thành | Rất cao | Dashboard `/venue-owner/bookings` xác nhận/từ chối/hủy |
| Booking | Player/Chủ sân hủy booking theo rule | Đã hoàn thành | Cao | Hủy khi PENDING/CONFIRMED, slot mở lại |
| Booking | Lịch sử trạng thái booking | Đã hoàn thành | Cao | Audit qua `BookingStatusHistory`, xem ở trang chi tiết booking `[bookingId]` |
| Notification | Thông báo booking mới/kết quả booking | Đã hoàn thành | Cao | In-app cho request/confirm/reject/cancel |

| Chat | Chat gắn với booking | Đã hoàn thành | Cao | Mở chat từ trang chi tiết booking, hiện context sân/giờ qua `Conversation.bookingContextId` |
| Availability | Polling trạng thái trống sân | Cần phát triển | Cao | Giai đoạn trước realtime |
| Availability | Realtime WebSocket/SSE | Cần phát triển sau | Trung bình | Làm sau khi booking ổn định |
| Dashboard | Dashboard vận hành booking cho Chủ sân | Cần phát triển | Cao | Hôm nay, chờ xác nhận, slot trống |
| Venue | Lọc/tìm kiếm/phân trang venue | Cải thiện sau | Trung bình | Không phải trọng tâm đầu tiên |
| Venue | Lịch sử duyệt venue | Cải thiện sau | Trung bình | Hữu ích nhưng sau booking |
| Ảnh | Xóa từng ảnh, sắp xếp ảnh, chọn ảnh đại diện | Cải thiện sau | Trung bình | Cải thiện trải nghiệm media |
| Thống kê | Lượt xem venue và lượt bắt đầu chat | Cải thiện sau | Thấp | Làm sau vận hành booking |
| Payment | Thanh toán online | Để giai đoạn sau | Thấp | Chỉ làm khi scope thanh toán được chốt |
| Authentication | Xác thực số điện thoại bằng SMS cho Player và Owner | Cao | Tránh việc phá hoại hệ thống, BOT ... Dùng dịch vụ bên ngoài hệ thống, ưu tiên chi phí rẻ và phổ biến cho project nhỏ tại Việt Nam |

## 9. Lộ trình triển khai đề xuất

### Giai đoạn 1: Nền tảng lịch trống sân

Mục tiêu: Chủ sân quản lý được sân con và slot trống.

Việc cần làm:

- Thêm data model `VenueResource`, `VenueScheduleRule`, `VenueTimeSlot`, `VenueBlackout`.
- Tạo màn hình quản lý sân con.
- Tạo màn hình cấu hình giờ hoạt động.
- Hiển thị lịch trống/bận cho Chủ sân.
- Cho phép khóa/mở slot thủ công.

### Giai đoạn 2: Booking không thanh toán

Mục tiêu: Player đặt sân trong hệ thống, Chủ sân xác nhận/từ chối.

Việc cần làm:

- Thêm data model `Booking`, `BookingSlot`, `BookingStatusHistory`.
- Cho Player chọn slot và gửi yêu cầu booking.
- Cho Chủ sân xem danh sách booking chờ xử lý.
- Chủ sân xác nhận/từ chối booking.
- Cập nhật slot theo trạng thái booking.
- Tạo notification cho booking events.

### Giai đoạn 3: Chat gắn với booking và dashboard vận hành

Mục tiêu: Chủ sân xử lý công việc hằng ngày trong một dashboard rõ ràng.

Việc cần làm:

- Mở chat từ booking detail.
- Hiển thị context booking trong chat.
- Thêm dashboard booking hôm nay/chờ xác nhận.
- Thêm quick actions: xác nhận, từ chối, nhắn Player, khóa slot.

### Giai đoạn 4: Cập nhật gần realtime/realtime

Mục tiêu: Trạng thái trống sân cập nhật nhanh cho Player và Chủ sân.

Việc cần làm:

- Bắt đầu bằng revalidate sau mutation và polling nhẹ.
- Sau khi ổn định, cân nhắc WebSocket hoặc Server-Sent Events.
- Bổ sung xử lý giữ slot có timeout nếu cần.

### Giai đoạn 5: Cải thiện sau

Mục tiêu: Nâng trải nghiệm quản lý, không chặn luồng vận hành chính.

Việc cần làm:

- Lọc/tìm kiếm/phân trang venue.
- Quản lý ảnh nâng cao.
- Lịch sử duyệt venue.
- Thống kê lượt xem/lượt chat.
- Thanh toán online nếu scope sản phẩm được mở rộng.

## 10. Tiêu chí nghiệm thu trọng tâm cho giai đoạn mới

- Chủ sân tạo được danh sách sân con cho từng venue.
- Chủ sân cấu hình được giờ hoạt động và slot trống.
- Chủ sân khóa/mở được slot thủ công.
- Player xem được slot còn trống trên venue approved/active.
- Player gửi được yêu cầu đặt sân.
- Hệ thống không cho double-book cùng một slot.
- Chủ sân xác nhận hoặc từ chối booking.
- Booking đổi trạng thái đúng rule.
- Slot cập nhật trạng thái theo booking.
- Player và Chủ sân nhận notification khi booking thay đổi.
- Player và Chủ sân chat được trong bối cảnh booking.
- Dashboard Chủ sân hiển thị booking hôm nay và booking chờ xác nhận.
