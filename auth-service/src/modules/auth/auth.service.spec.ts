import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prisma: PrismaService;
  let userService: UserService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  const mockPrismaService = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUserService = {
    createUser: jest.fn(),
    findByEmail: jest.fn(),
    getUserWithPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    prisma = module.get<PrismaService>(PrismaService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user and return tokens', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
      };

      const createdUser = {
        id: '1',
        email: dto.email,
        fullName: dto.fullName,
        role: 'CUSTOMER',
      };

      mockUserService.createUser.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('mocked-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result.accessToken).toBe('mocked-token');
      expect(result.refreshToken).toBe('mocked-token');
      expect(result.user.email).toBe(dto.email);
      expect(mockUserService.createUser).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const user = {
        id: '1',
        email: dto.email,
        fullName: 'Test User',
        role: 'CUSTOMER',
      };

      const userWithPassword = {
        ...user,
        password: '$2b$10$hashedpassword', // bcrypt hashed
      };

      mockUserService.findByEmail.mockResolvedValue(user);
      mockUserService.getUserWithPassword.mockResolvedValue(userWithPassword);
      mockJwtService.sign.mockReturnValue('mocked-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      // Mock bcrypt compare
      jest.mock('bcrypt', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      const result = await service.login(dto);

      expect(result.user.email).toBe(dto.email);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(dto.email);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const user = {
        id: '1',
        email: dto.email,
        fullName: 'Test User',
        role: 'CUSTOMER',
      };

      mockUserService.findByEmail.mockResolvedValue(user);
      mockUserService.getUserWithPassword.mockResolvedValue({
        ...user,
        password: 'hashed-different-password',
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens with token rotation', async () => {
      const dto = {
        refreshToken: 'valid-refresh-token',
      };

      const payload = { sub: '1', email: 'test@example.com' };
      const refreshTokenRecord = {
        id: 'token-id',
        token: dto.refreshToken,
        userId: '1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'CUSTOMER',
        },
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        refreshTokenRecord,
      );
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-token');

      const result = await service.refresh(dto);

      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-token');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: { isRevoked: true },
      });
    });

    it('should throw error if refresh token is revoked', async () => {
      const dto = {
        refreshToken: 'revoked-token',
      };

      const revokedTokenRecord = {
        id: 'token-id',
        token: dto.refreshToken,
        userId: '1',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        revokedTokenRecord,
      );

      await expect(service.refresh(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
