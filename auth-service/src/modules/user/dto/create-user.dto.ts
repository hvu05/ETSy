import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @ApiProperty({ example: 'admin@example.com', description: 'The email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123', description: 'The password (min length 8)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Alice Johnson', description: 'The full name of the user' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+1234567890', description: 'The phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'ADMIN', enum: UserRole, description: 'The system role of the user', required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UserResponseDto {
  @ApiProperty({ example: 'user-id-uuid' })
  id: string;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiProperty({ example: 'Alice Johnson' })
  fullName: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'ADMIN', enum: UserRole })
  role: string;

  @ApiProperty({ example: '2026-06-11T20:57:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-11T20:57:00Z' })
  updatedAt: Date;
}
