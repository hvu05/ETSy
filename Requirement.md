## 1. Các Tác Nhân Trong Hệ Thống (Actors)

- **Khách hàng (Customer):** Người tìm kiếm sự kiện, chọn ghế, đặt giữ chỗ và thanh toán vé, xem lịch sử đơn hàng.
- **Ban tổ chức sự kiện (Organizer):** Người tạo sự kiện, tạo số vé, từng hạng vé (loại định danh hay không định danh), theo dõi doanh thu.
- **Quản trị viên (Admin):** Người quản lý toàn bộ hệ thống, duyệt sự kiện, quản lý người dùng, xem báo cáo.

## 2. Các Yêu Cầu Chức Năng (Functional Requirements)

### MODULE 1: Quản Lý Sự Kiện & Vé (Organizer Side)

- **FR-1.1 (Tạo Sự Kiện):** Organizer có thể tạo sự kiện mới bao gồm: Tên, mô tả, banner, thời gian diễn ra và thời gian bắt đầu mở bán vé.
- **FR-1.2 (Cấu Hình Sơ Đồ Ghế/Loại Vé):** Organizer có thể cấu hình các hạng vé (VIP, Standard, GA) kèm theo số lượng tồn kho (Inventory) hoặc tọa độ ghế cụ thể (Hàng A - Ghế 12).
- **FR-1.3 (Đóng/Mở Bán Vé):** Hệ thống phải tự động kích hoạt trạng thái "Mở bán" đúng khung giờ cấu hình và cho phép Admin đóng cổng bán vé thủ công khi có sự cố.
- **FR-1.4 (Giới hạn user mua vé):** Giới hạn mỗi thiết bị chỉ có thể mua tối đa bao nhiêu vé.

### MODULE 2: Duyệt & Tìm Kiếm Sự Kiện (Customer Side)

- **FR-2.1 (Xem Danh Sách Sự Kiện):** Khách hàng có thể xem danh sách sự kiện đang hot, sắp diễn ra. *(Yêu cầu kỹ thuật ngầm: Phải được cache tại Redis để chịu tải).*
- **FR-2.2 (Xem Sơ Đồ Ghế Thời Gian Thực):** Khách hàng có thể bấm vào một sự kiện để xem sơ đồ chi tiết, biết được chính xác vị trí nào còn trống, vị trí nào đang bị khóa tạm thời hoặc đã bán.

### MODULE 3: Đặt Chỗ & Giữ Vé Tạm Thời (Giai đoạn High Concurrency)

Đây là module cốt lõi chịu áp lực Traffic lớn nhất khi mở bán:

- **FR-3.1 (Chọn Ghế & Đẩy Vào Hàng Đợi):** Khi Khách hàng bấm "Đặt vé", hệ thống lập tức tiếp nhận request, đẩy vào hàng đợi **Redis Bull Queue** của Booking Service và trả về trạng thái "Đang xử lý".
- **FR-3.2 (Khóa Ghế Tạm Thời - Hold Ticket):**
    - Khi Worker xử lý đến lượt, hệ thống kiểm tra nếu ghế còn trống, lập tức chuyển trạng thái ghế từ `Available` sang `Reserved` (Tạm giữ).
    - Hệ thống kích hoạt thời gian đếm ngược (TTL) **10 phút** để Khách hàng thực hiện thanh toán.
- **FR-3.3 (Tự Động Giải Phóng Ghế - Timeout):** Nếu sau 10 phút Khách hàng không hoàn tất thanh toán, hệ thống phải tự động hủy lượt đặt chỗ, chuyển trạng thái ghế từ `Reserved` ngược lại thành `Available` để người khác mua.

### MODULE 4: Thanh Toán & Xác Nhận Đơn Hàng (Order & Payment)

- **FR-4.1 (Tạo Đơn Hàng):** Sau khi giữ ghế thành công, hệ thống tạo một Đơn hàng (`Order`) với trạng thái `Pending_Payment`.
- **FR-4.2 (Xử Lý Thanh Toán):** Khách hàng thực hiện thanh toán (giả lập qua Webhook của cổng thanh toán Momo/ZaloPay/VNPAY).
- **FR-4.3 (Hoàn Tất Đơn Hàng & Xuất Vé):**
    - Nếu thanh toán thành công: Chuyển trạng thái Đơn hàng thành `Success`, trạng thái Vé thành `Sold`. Gửi mail vé điện tử (QR Code) cho khách.
    - Nếu thanh toán thất bại/Khách chủ động hủy: Chuyển trạng thái Đơn hàng thành `Failed`, giải phóng Vé về `Available`.

## 3. Ma Trận Chuyển Đổi Trạng Thái Vé (Ticket State Machine)

Để viết code hệ thống không bị bug logic, bạn cần tuân thủ nghiêm ngặt các trạng thái này của một chiếc vé:

`[Available] --(User bấm đặt / Đẩy vào Queue)--> [Reserved] --(Thanh toán thành công)--> [Sold]
     ^                                               |
     |---------------(Hết 10p / Hủy thanh toán)------|`

| **Trạng thái hiện tại** | **Hành động (Trigger)** | **Trạng thái tiếp theo** | **Logic xử lý ngầm** |
| --- | --- | --- | --- |
| **Available** (Trống) | Khách bấm chọn giữ ghế | **Reserved** | Tạo Redis Distributed Lock để giữ chỗ, chạy TTL 10 phút. |
| **Reserved** (Tạm giữ) | Hết 10 phút hoặc lỗi thanh toán | **Available** | Xóa Lock trên Redis, hoàn trả trạng thái trong DB để người khác mua. |
| **Reserved** (Tạm giữ) | Nhận Webhook thanh toán thành công | **Sold** | Chuyển trạng thái vĩnh viễn trong DB, kết thúc chu kỳ. |

## 4. Tiêu Chí Nghiệm Thu Phi Chức Năng (Non-Functional Requirements)

Để hệ thống đặt vé này đạt chuẩn "Production-ready" như bạn mong muốn, các chức năng trên phải chạy kèm theo các điều kiện:

1.  **Response Time (API xem vé):** `< 50ms` với 10.000 request đồng thời (nhờ Redis Cache).
2.  **Tính Toàn Vẹn (Data Consistency):** Tuyệt đối không xảy ra hiện tượng 2 Đơn hàng thành công trên cùng 1 ID Vé (No Overbooking).
3.  **Hạ tải (Graceful Degradation):** Khi PostgreSQL bị quá tải, hệ thống không được sập hoàn toàn (trả về lỗi 500) mà phải giới hạn tốc độ xử lý của Worker và hiển thị màn hình chờ cho User.
4.  **Khả năng mở rộng (Scalability):** Thiết kế độc lập các service Auth, Search, Booking và Payment. Dùng Redis Bull Queue đệm tải và xử lý bất đồng bộ, sẵn sàng scale ngang khi lượng truy cập tăng đột biến.
5.  **Khả năng bảo trì (Maintainability):** Phân tách module rõ ràng, giao tiếp liên dịch vụ qua Kafka Events để giảm khớp nối (loose coupling), đảm bảo dễ dàng cập nhật/mở rộng tính năng và debug lỗi bằng Correlation ID.