## ⬜ Giai Đoạn 1: Khởi Tạo Dự Án & Cấu Hình Database

* [ ] **Task 1.1:** Khởi tạo dự án NestJS mới và cài đặt các thư viện cần thiết: `@prisma/client`, `prisma`, `passport`, `passport-jwt`, `@nestjs/jwt`, `@nestjs/passport`, `bcrypt`, `class-validator`, `class-transformer`.
* [ ] **Task 1.2:** Tạo file `prisma/schema.prisma` với các Model: `User`, `RefreshToken` và `Role` enum đúng như file `implementation_plan.md`.
* [ ] **Task 1.3:** Khởi tạo lớp `PrismaService` kế thừa từ `PrismaClient` để quản lý kết nối cơ sở dữ liệu một cách tập trung.
* [ ] **Task 1.4:** Cấu hình file `.env` mẫu và tích hợp `ConfigModule` để quản lý biến môi trường (`JWT_SECRET`, `DATABASE_URL`).

## ⬜ Giai Đoạn 2: Xây Dựng User Module

* [ ] **Task 2.1:** Tạo `UserModule`, `UserService`, và `UserController`.
* [ ] **Task 2.2:** Triển khai hàm `createUser` trong `UserService` (Có băm mật khẩu bằng `bcrypt` với `saltOrRounds = 10` và kiểm tra trùng lặp email).
* [ ] **Task 2.3:** Triển khai hàm `findByEmail` và `findById` để phục vụ logic xác thực.
* [ ] **Task 2.4:** Viết unit test cho `UserService` đảm bảo bao phủ luồng tạo mới và tìm kiếm.

## ⬜ Giai Đoạn 3: Xây Dựng Auth Module & Cơ Chế Bảo Mật

* [ ] **Task 3.1:** Tạo `AuthModule`, `AuthService`, và `AuthController`.
* [ ] **Task 3.2:** Định nghĩa các DTO cần thiết: `RegisterDto`, `LoginDto`, `RefreshDto` có sử dụng `class-validator` để kiểm tra định dạng dữ liệu đầu vào.
* [ ] **Task 3.3:** Viết hàm mã hóa và cấp phát Token (`generateTokens`) trả về cả `accessToken` và `refreshToken`.
* [ ] **Task 3.4:** Triển khai hàm `login` và `register` trong `AuthService`.
* [ ] **Task 3.5:** Triển khai logic xoay vòng Token (`refresh`) bảo mật cao: Kiểm tra token hợp lệ trong DB, nếu đã bị Revoked hoặc hết hạn thì từ chối ngay lập tức.
* [ ] **Task 3.6:** Cấu hình `JwtStrategy` của Passport để giải mã Access Token từ header `Authorization: Bearer <token>`.
* [ ] **Task 3.7:** Tạo `JwtAuthGuard` toàn cục hoặc cục bộ để bảo vệ endpoint `GET /users/me`.

## ⬜ Giai Đoạn 4: Kiểm Thử E2E & Tinh Chỉnh

* [ ] **Task 4.1:** Viết kịch bản kiểm thử E2E (Integration test) cho luồng: Đăng ký -> Đăng nhập -> Lấy Profile cá nhân -> Refresh Token -> Đăng xuất.
* [ ] **Task 4.2:** Rà soát toàn bộ mã nguồn, xóa bỏ các đoạn mã dư thừa, đảm bảo xử lý lỗi (catch error) đầy đủ, phản hồi HTTP Status Code chuẩn xác.
"""

```
Tuyệt vời! Tôi đã đóng gói thiết kế Database Schema (cho User Service) cùng với toàn bộ các quy tắc sinh mã (Prompting rules) vào 2 file Markdown chuẩn xác để bạn thả thẳng vào IDE (Cursor, GitHub Copilot Chat, Roo Code,...).

Dưới đây là 2 file mà bạn cần:

1. File **implementation_plan.md** chứa:
   - Schema Database bằng Prisma (Model `User`, `RefreshToken`).
   - Cấu trúc thư mục (Folder structure) yêu cầu AI tuân thủ.
   - Danh sách API cần triển khai.
   - Các quy tắc (Rules) bắt buộc AI không được viết code giả (mock), xử lý lỗi chuẩn NestJS, và bảo mật bằng băm mật khẩu.

2. File **task.md** chứa:
   - Danh sách công việc (Checklist) dạng `[ ]` để AI tự động đánh dấu khi code xong mỗi giai đoạn.
   - Chia làm 4 giai đoạn rõ ràng: Khởi tạo -> User Module -> Auth Module (JWT, Passport) -> Viết Test.
