Tài liệu này cung cấp toàn bộ thiết kế kiến trúc, cấu trúc cơ sở dữ liệu (Prisma), danh sách API và các quy tắc bảo mật nhằm hướng dẫn AI trong IDE (Cursor, Copilot, Roo Code) sinh mã nguồn một cách chính xác, toàn diện, không bỏ sót hoặc viết code giả (mock/todo).

## 1. Công Nghệ Sử Dụng (Tech Stack)
- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Bảo mật:** JWT (`@nestjs/jwt`), Passport (`@nestjs/passport`), `bcrypt` (băm mật khẩu)
- **Kiểm thử:** Jest (Unit test & Integration test)
- **Validation:** `class-validator`, `class-transformer`

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (Prisma Schema)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  ORGANIZER
  ADMIN
}

model User {
  id           String         @id @default(uuid())
  email        String         @unique
  password     String         // Đã băm bằng bcrypt
  fullName     String
  phoneNumber  String?
  role         Role           @default(CUSTOMER)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  
  refreshTokens RefreshToken[]

  @@index([email])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique // Lưu chuỗi đã hash hoặc chuỗi UUID ngẫu nhiên
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([token, userId])
}

```

---

## 3. Kiến Trúc Mã Nguồn (Folder Structure)

Yêu cầu AI tuân thủ cấu trúc thư mục module chuẩn của NestJS:

```text
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   └── interceptors/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   └── strategies/
│   └── user/
│       ├── user.controller.ts
│       ├── user.service.ts
│       └── user.module.ts
└── prisma/
    └── prisma.service.ts

```

---

## 4. Danh Sách API Cần Triển Khai

### 🔹 Module Auth (`/auth`)

1. `POST /auth/register`: Đăng ký người dùng mới (Mặc định Role: CUSTOMER). Bắt buộc mã hóa mật khẩu trước khi lưu.
2. `POST /auth/login`: Xác thực email/password. Trả về cặp `accessToken` (TTL: 15 phút) và `refreshToken` (TTL: 7 ngày). Lưu `refreshToken` vào DB.
3. `POST /auth/refresh`: Tiếp nhận `refreshToken` hợp lệ, kiểm tra DB, thực hiện cơ chế **Token Rotation** (Cấp cặp Access/Refresh mới và hủy Token cũ).
4. `POST /auth/logout`: Vô hiệu hóa (`isRevoked = true`) hoặc xóa `refreshToken` hiện tại khỏi DB.

### 🔹 Module User (`/users`)

1. `GET /users/me`: Trả về thông tin chi tiết của User đang đăng nhập dựa trên `accessToken` ở Header (Yêu cầu qua AuthGuard).

---

## 5. Các Quy Tắc Ràng Buộc Đối Với AI khi Code (Prompting Rules)

1. **Tuyệt đối không dùng code giả:** Không viết các đoạn mã kiểu `// TODO`, `// Implement later`, hay bỏ bớt hàm. Mọi file sinh ra phải hoàn chỉnh, sẵn sàng chạy.
2. **Xử lý ngoại lệ (Exception Handling):** Bắt buộc sử dụng NestJS Built-in Exceptions (ví dụ: `ConflictException` khi trùng email, `UnauthorizedException` khi sai mật khẩu/token hết hạn).
3. **Bảo mật JWT Payload:** Chỉ nén dữ liệu tối giản vào JWT: `{ sub: userId, email: email, role: role }`. Không đưa mật khẩu hoặc thông tin nhạy cảm vào token.
4. **Viết Unit Test đầy đủ:** Mỗi Service được tạo ra phải kèm theo file `.spec.ts` tương ứng bao quát tối thiểu 80% luồng nghiệp vụ chính.
"""


## 6. Yếu cầu đặc biệt
1. Bất cứ vấn đề nào (không phải hiển nhiên) mà chưa rõ thì luôn phải hỏi lại.
# Content for tasks.md

task_content = """# Danh Sách Nhiệm Vụ (Task Checklist) cho AI - Triển Khai User Service

AI hãy bám sát danh sách nhiệm vụ này để thực hiện tuần tự. Hãy tích dấu `[x]` sau khi hoàn thành xong trọn vẹn một task và đảm bảo không có lỗi biên dịch (Compilation error).

Nội dung này trong file /agents/tasks.md