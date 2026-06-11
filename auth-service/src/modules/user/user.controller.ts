import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin / Organizer / Customer)' })
  @ApiResponse({ status: 201, description: 'User successfully created.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Return current user profile.', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMe(@Request() req: any) {
    return this.userService.findById(req.user.sub);
  }
}
