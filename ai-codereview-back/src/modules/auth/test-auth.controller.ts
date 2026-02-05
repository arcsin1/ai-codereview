import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';

@Controller('test-auth')
@Public()
export class TestAuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('users')
  async getAllUsers() {
    const users = await this.userRepository.find({
      select: ['id', 'username', 'email', 'isActive'],
    });
    return { users, count: users.length };
  }

  @Get('find-admin')
  async findAdmin() {
    const admin = await this.userRepository.findOne({
      where: { username: 'admin' },
      select: ['id', 'username', 'email', 'isActive'],
    });
    return admin || { message: 'Not found' };
  }
}
