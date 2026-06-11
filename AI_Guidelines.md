# Hướng Dẫn Dành Cho AI (AI Working Guidelines & Rules)

Tài liệu này định nghĩa các quy tắc, tiêu chuẩn code và nguyên tắc hoạt động mà mọi AI Agent (bao gồm cả bạn) phải tuân thủ nghiêm ngặt khi làm việc trên hệ thống Microservices của dự án ETSy.

---

## 📌 QUY TẮC BẮT BUỘC (RULE ZERO)
Trước khi thực hiện bất kỳ nhiệm vụ nào (sửa code, thiết kế API, viết test), AI phải đọc hai tài liệu sau để nắm giữ bối cảnh:
1.  [Project_Context.md](file:///c:/Users/ASUS/OneDrive/Desktop/ETSy/Project_Context.md) - Bối cảnh nghiệp vụ và các bài toán kỹ thuật theo kiến trúc Microservices.
2.  [Requirement.md](file:///c:/Users/ASUS/OneDrive/Desktop/ETSy/Requirement.md) - Các yêu cầu chức năng và phi chức năng.

---

## 🛠️ Công Nghệ & Tiêu Chuẩn Code (Tech Stack & Coding Standards)

### 1. Cấu Trúc Microservices
Hệ thống được chia làm 4 dịch vụ độc lập. Khi phát triển tính năng, cần xác định rõ code thuộc dịch vụ nào:
*   **Auth Service:** Chứa logic xác thực người dùng, đăng ký, đăng nhập, quản lý token (access & refresh token rotation), phân quyền người dùng (CUSTOMER, ORGANIZER, ADMIN) và bảo vệ các API bằng JWT.
*   **Booking Service:** Chứa logic nghiệp vụ quản lý sự kiện, vé, đơn hàng tạm thời, Redis Distributed Lock giữ ghế, Redis Bull Queue làm hàng đợi mua vé, Kafka Consumer (cho event thanh toán) và Kafka Producer (cho event thay đổi trạng thái ghế).
*   **Payment Service:** Chứa logic tích hợp Momo/ZaloPay/VNPAY, xử lý Webhook thanh toán, hoàn tiền, Kafka Producer (cho event thanh toán thành công/lỗi) và Kafka Consumer (cho event yêu cầu hoàn tiền).
*   **Search Service:** Chứa logic truy vấn danh sách sự kiện, sơ đồ ghế, tối ưu Redis Cache, Kafka Consumer (lắng nghe các event từ Booking Service để cập nhật cache thời gian thực).

*Quy tắc phát triển:*
*   **Dependency Injection:** Sử dụng Dependency Injection (DI) theo chuẩn của framework được chọn để quản lý dependencies.
*   **Logging & Tracing:** Sử dụng thư viện/Logger chuẩn của dịch vụ. Mọi log trong luồng xử lý liên dịch vụ phải đi kèm với **Correlation ID (Trace ID)** để dễ dàng trace log từ Gateway -> Booking -> Payment -> Kafka. **TUYỆT ĐỐI KHÔNG** dùng `console.log()` trực tiếp.
*   **Shared Types/Events:** Các schemas sự kiện gửi qua Kafka phải được định nghĩa tường minh (ví dụ: dùng DTO chung hoặc Protobuf) để tránh lệch dữ liệu giữa các service.

### 2. Quản Lý Database & Tính Nhất Quán (Database & Saga Pattern)
*   **PostgreSQL Transactions:** Các thao tác thay đổi dữ liệu trong Booking DB (giữ ghế, đổi trạng thái đơn hàng) hoặc Payment DB phải bọc trong database transaction để đảm bảo tính Acid cục bộ.
*   **Saga Pattern (Choreography):** Vì các dịch vụ chạy DB riêng biệt, không được viết query liên kết DB (no cross-DB queries). Tất cả giao dịch phân tán phải được điều phối qua Kafka Events.
*   **Pessimistic Locking:** Sử dụng cơ chế lock phù hợp (ví dụ: `SELECT ... FOR UPDATE`) khi Booki8ng Worker cập nhật trạng thái vé trực tiếp dưới DB để tránh Race Condition.

### 3. Caching & Distributed Lock: Redis
*   **Search Cache (Search Service):** Cache toàn bộ danh sách sự kiện và sơ đồ ghế. Khi có event `TicketStateChanged` từ Kafka, Search Service phải cập nhật hoặc invalidate cache tương ứng ngay lập tức.
*   **Distributed Lock (Booking Service):** Khi nhận request giữ ghế, Booking Service bắt buộc phải dùng Redis Lock (Redlock) với khóa `lock:ticket:${ticketId}` trước khi cập nhật DB.

### 4. Message Queue: Kafka (Event-Driven) & Redis Bull Queue (Job Queue)
*   **Redis Bull Queue (trong Booking Service):**
    *   `ticket-reservation-queue`: Hàng đợi mua vé. Khi Client gửi yêu cầu giữ chỗ qua Gateway, Booking Service nhận và đẩy vào hàng đợi này để xử lý bất đồng bộ.
*   **Kafka Topics:** Định nghĩa rõ ràng các topics phục vụ luồng nghiệp vụ bất đồng bộ liên dịch vụ:
    *   `payment-events`: Phát event kết quả thanh toán từ Payment Service (`PaymentCompleted`, `PaymentFailed`).
    *   `ticket-events`: Phát event thay đổi trạng thái ghế (`TicketReserved`, `TicketReleased`, `TicketSold`) từ Booking Service để Search Service đồng bộ cache.
    *   `refund-events`: Phát event yêu cầu hoàn tiền từ Booking Service sang Payment Service (`RefundRequested`).

---

## 🛠️ Nguyên Tắc Thiết Kế (Scalability & Maintainability)
Mọi thiết kế và triển khai mã nguồn trên ETSy đều phải tuân thủ hướng kiến trúc:
*   **Dễ bảo trì (Maintainable):** Viết code sạch, phân tách các module/services rõ ràng, xử lý exception đầy đủ, ghi log đi kèm với Correlation ID. Giao tiếp lỏng (loose coupling) giữa các service qua Kafka Events để hạn chế ảnh hưởng dây chuyền khi một dịch vụ xảy ra sự cố.
*   **Dễ mở rộng (Scalability):** Thiết kế các service độc lập để sẵn sàng scale ngang khi cần. Sử dụng hàng đợi (Redis Bull Queue) để điều phối tải, dùng cache (Redis Cache) để tối ưu luồng đọc, tránh thắt nút cổ chai (bottleneck) tại cơ sở dữ liệu.

## ⚠️ Quy Tắc Xử Lý Các Bài Toán Đặc Thù (Specific Implementation Recipes)

### 1. Cơ chế Chống Spam (Idempotency Key)
*   API đặt vé (`POST /bookings/reserve`) bắt buộc phải gửi kèm header `x-idempotency-key` từ Client.
*   Booking Service sử dụng một Guard/Interceptor để kiểm tra key này trong Redis:
    *   Nếu key tồn tại: Trả về kết quả xử lý trước đó hoặc báo lỗi "Request đang được xử lý".
    *   Nếu key chưa tồn tại: Lưu key vào Redis với TTL từ 5-10 giây, tiếp tục chuyển request vào Kafka queue.

### 2. Xử lý Webhook Thanh Toán Trễ (Late Webhook - Saga Flow)
Khi thanh toán hoàn tất sau 10 phút TTL giữ ghế, quy trình liên dịch vụ phải chạy như sau:
1.  **Payment Service** nhận Webhook thanh toán thành công -> Ghi log giao dịch thanh toán thành công -> Phát event `PaymentCompleted` (payload gồm: `bookingId`, `ticketId`, `amount`, `paymentTime`).
2.  **Booking Service** consume event `PaymentCompleted`:
    *   Mở một DB Transaction.
    *   Kiểm tra trạng thái của vé (`ticketId`):
        *   **Trường hợp 1 (Vé vẫn trống - `Available`):**
            *   Khóa vé bằng Redis Lock.
            *   Cập nhật trạng thái vé thành `Sold` và đơn hàng thành `Success`.
            *   Commit Transaction.
            *   Phát event `TicketSold` lên Kafka để Search Service sync cache. Gửi mail QR Code cho khách.
        *   **Trường hợp 2 (Vé đã bị người khác mua/giữ - `Reserved` hoặc `Sold`):**
            *   Cập nhật đơn hàng thành `Failed_Expired` (Thanh toán lỗi do hết hạn và mất ghế).
            *   Commit Transaction.
            *   Phát event `RefundRequested` (payload gồm: `paymentId`, `amount`, `reason: "Seat_Not_Available"`) lên Kafka.
3.  **Payment Service** consume event `RefundRequested`:
    *   Gọi API hoàn tiền của cổng thanh toán tương ứng (Momo/ZaloPay/VNPAY).
    *   Cập nhật trạng thái giao dịch thanh toán thành `Refunded`.
    *   Gửi email thông báo hoàn tiền thành công cho khách hàng do sự cố hết hạn giữ chỗ.

### 3. Đảm Bảo Không Overbooking (Không bán trùng ghế)
*   Trạng thái vé chỉ được chuyển từ `Available` -> `Reserved` -> `Sold` theo đúng State Machine.
*   Mỗi bước chuyển đổi trạng thái phải đi kèm câu lệnh kiểm tra điều kiện (Atomic Update). Ví dụ:
    ```sql
    UPDATE tickets SET status = 'Reserved', user_id = :userId, reserved_at = :now 
    WHERE id = :ticketId AND status = 'Available';
    ```
    Nếu số dòng cập nhật (affected rows) = 0, báo lỗi ngay lập tức là ghế đã bị người khác chọn.

---

## 📋 Quy Trình Làm Việc Của AI (AI Workflow)

Khi nhận một task mới, bạn phải tuân thủ quy trình sau:

1.  **Phân Tích & Nghiên Cứu:**
    *   Đọc kĩ yêu cầu của người dùng.
    *   Xác định rõ task thuộc Service nào (`booking-service`, `payment-service`, hay `search-service`).
    *   Xác định các Kafka events cần phát hoặc tiêu thụ liên quan đến luồng nghiệp vụ.
Đặc biệt, chỗ nào không chắc chắn phải hỏi lại.
2.  **Lập Implementation Plan (Nếu là thay đổi phức tạp):**
    *   Tạo file `implementation_plan.md` mô tả các service chịu ảnh hưởng, cấu trúc Kafka payload và sơ đồ luồng dữ liệu (Saga).
    *   Chờ người dùng đồng ý mới bắt đầu code.
3.  **Thực Hiện & Theo Dõi:**
    *   Tạo file `task.md` để ghi nhận danh sách đầu việc cần làm.
    *   Code cẩn thận, viết các đoạn xử lý exception đầy đủ.
    *   Cập nhật tiến độ vào `task.md`.
4.  **Kiểm Tra & Xác Minh (Verification):**
    *   Chạy unit/integration test của service đó.
    *   Viết script test giả lập gửi message Kafka hoặc dùng curl để verify API chạy đúng thiết kế.
    *   Tạo file `walkthrough.md` mô tả kết quả test và code đã sửa.
