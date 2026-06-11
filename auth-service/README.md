# ETSy - Authentication Service

ETSy is a high-concurrency event ticketing system. The **Auth Service** is a core microservice built on NestJS that handles secure user registration, authentication, token rotation, and authorization across the ETSy platform.

## 🚀 Key Features

- **Standard REST APIs**: Complete endpoints for user authentication and profile management.
- **Global API Versioning**: All endpoints are prefixed under `/api/v1/...`.
- **API Documentation**: Automated OpenAPI (Swagger) interface.
- **Secure Authentication**: Built with **Passport** and **JSON Web Tokens (JWT)**.
- **Token Rotation Strategy**: Secure token refresh flow to mitigate replay attacks (prevents refresh token reuse).
- **Global Response Interception**: Automatically formats all successful API responses into a unified pattern:
  ```json
  {
    "statusCode": 200,
    "message": "Success",
    "data": { ... }
  }
  ```
- **Robust Database Engine**: Powered by **PostgreSQL** and managed with **Prisma ORM**.

---

## 🛠️ Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database Engine**: PostgreSQL
- **Security**: Passport, JWT, bcrypt
- **Validation**: class-validator, class-transformer
- **OpenAPI**: Swagger

---

## 🏗️ Project Structure

```text
src/
├── app.module.ts              # Main root module
├── main.ts                    # Application entry point
├── common/                    # Shared resources
│   ├── guards/
│   │   └── jwt-auth.guard.ts  # Guard to protect routes with JWT
│   └── interceptors/
│       ├── response.interceptor.ts         # Global standard API response formatter
│       └── response-message.decorator.ts   # Custom message decorator for responses
├── modules/                   # Core business logic modules
│   ├── auth/                  # Authentication Module
│   │   ├── auth.controller.ts # Auth route endpoints
│   │   ├── auth.service.ts    # Logic for login, signup, token rotation
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   └── auth.dto.ts    # Input validation & Swagger metadata
│   │   └── strategies/
│   │       └── jwt.strategy.ts# Passport JWT authentication strategy
│   └── user/                  # User Management Module
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.module.ts
│       └── dto/
│           └── create-user.dto.ts
└── prisma/
    └── prisma.service.ts      # Database client service
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended, current workspace uses v22.13.0)
- [PostgreSQL](https://www.postgresql.org/) database server running locally or in Docker

### 2. Configure Environment Variables
Create a `.env` file in the root of the `auth-service` directory (you can copy `.env.example` as a starting point) and adjust the parameters:

```env
PORT=5001
DATABASE_URL="postgresql://postgres:123456@localhost:5432/auth_db"
JWT_SECRET="9T0psjfEoF1PoIfYeZ0lqUCqoVeeXuKfo1PYW7f93tBTfQuR2eBPaYa8DtguPSVD"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
NODE_ENV="development"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Migrations
Ensure PostgreSQL is running, then apply the Prisma schema to create the tables:
```bash
npx prisma migrate dev --name init
```
Generate the Prisma Client code:
```bash
npx prisma generate
```

---

## 🏃 Running the Application

### Development Mode (with hot-reloading)
```bash
npm run start:dev
```

### Production Mode
Build the project:
```bash
npm run build
```
Run the compiled code:
```bash
npm run start:prod
```

---

## 📖 API Documentation (Swagger)

Once the application is running, the interactive Swagger documentation is accessible at the following URL:

👉 **[http://localhost:5001/api/v1/docs](http://localhost:5001/api/v1/docs)**

### What you can do in Swagger UI:
- **Explore Endpoints**: Read definitions for all available `/api/v1/auth/*` and `/api/v1/users/*` routes.
- **Inspect Schemas**: View detailed input/output DTOs and field requirements.
- **Authorize & Test**: Click on the **Authorize** button, input your Bearer token, and test protected routes like `GET /api/v1/users/me` directly in the browser.
