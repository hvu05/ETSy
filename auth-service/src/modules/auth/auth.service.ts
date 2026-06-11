import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async register(dto: RegisterDto) {
    // Create user
    const user = await this.userService.createUser({
      ...dto,
      role: 'CUSTOMER' as any,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.userService.findByEmail(dto.email);

    // Get user with password field
    const userWithPassword = await this.userService.getUserWithPassword(user.id);

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      userWithPassword.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    try {
      // Check if token exists in DB and not revoked
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token: dto.refreshToken },
        include: { user: true },
      });

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token is invalid');
      }

      if (refreshToken.isRevoked) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Check expiration
      if (refreshToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Token Rotation: Revoke old token and issue new pair
      await this.prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: { isRevoked: true },
      });

      // Generate new token pair
      const tokens = await this.generateTokens(
        refreshToken.userId,
        refreshToken.user.email,
        refreshToken.user.role,
      );

      return {
        ...tokens,
        user: {
          id: refreshToken.user.id,
          email: refreshToken.user.email,
          fullName: refreshToken.user.fullName,
          role: refreshToken.user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!token) {
      throw new BadRequestException('Invalid refresh token');
    }

    // Revoke token
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    // Generate access token (15 minutes)
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { expiresIn: '15m' },
    );

    // Generate refresh token UUID
    const refreshTokenValue = uuidv4();

    // Store refresh token in DB with 7 days expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}
