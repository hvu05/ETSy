import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user (min length 6)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'The full name of the user' })
  @IsString()
  fullName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  @IsString()
  password: string;
}

export class RefreshDto {
  @ApiProperty({ example: 'uuid-token-string', description: 'The refresh token' })
  @IsString()
  refreshToken: string;
}

export class UserProfileDto {
  @ApiProperty({ example: 'user-id-uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'CUSTOMER' })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'jwt-access-token-string' })
  accessToken: string;

  @ApiProperty({ example: 'uuid-refresh-token-string' })
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
