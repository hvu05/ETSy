import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth Flow E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clear database before each test
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Full Auth Flow', () => {
    it('should complete full auth flow: register -> login -> get profile -> refresh -> logout', async () => {
      // Step 1: Register
      const registerDto = {
        email: 'testuser@example.com',
        password: 'Password123',
        fullName: 'Test User',
      };

      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(registerRes.body).toHaveProperty('accessToken');
      expect(registerRes.body).toHaveProperty('refreshToken');
      expect(registerRes.body.user.email).toBe(registerDto.email);

      const { accessToken, refreshToken } = registerRes.body;

      // Step 2: Get current user profile with accessToken
      const profileRes = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileRes.body.email).toBe(registerDto.email);
      expect(profileRes.body.fullName).toBe(registerDto.fullName);

      // Step 3: Logout (revoke refresh token)
      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(201);

      expect(logoutRes.body).toHaveProperty('message');

      // Step 4: Try to refresh with revoked token (should fail)
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should register, login, and get new tokens via refresh', async () => {
      // Register
      const registerDto = {
        email: 'user2@example.com',
        password: 'StrongPass123',
        fullName: 'User Two',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(201);

      expect(loginRes.body).toHaveProperty('accessToken');
      expect(loginRes.body).toHaveProperty('refreshToken');

      const { refreshToken: oldRefreshToken } = loginRes.body;

      // Refresh tokens
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(201);

      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(refreshRes.body).toHaveProperty('refreshToken');

      // Old refresh token should be revoked
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);

      // New refresh token should work
      const newRefreshToken = refreshRes.body.refreshToken;
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: newRefreshToken })
        .expect(201);
    });

    it('should reject login with wrong password', async () => {
      const registerDto = {
        email: 'user3@example.com',
        password: 'CorrectPassword123',
        fullName: 'User Three',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerDto.email,
          password: 'WrongPassword123',
        })
        .expect(401);
    });

    it('should reject register with duplicate email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'Password123',
        fullName: 'User One',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should reject access to protected endpoint without token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('should reject access to protected endpoint with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  afterEach(async () => {
    // Clean up database
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });
});

