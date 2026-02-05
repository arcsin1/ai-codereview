import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto';
import { ConfigService } from '@nestjs/config';

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<User | null> {
    this.logger.log(`Validating user: ${identifier}`);

    // Try to find user by username first
    let user = await this.userRepository.findOne({
      where: { username: identifier },
    });

    // If not found, try to find by email
    if (!user) {
      user = await this.userRepository.findOne({
        where: { email: identifier },
      });
    }

    if (!user) {
      this.logger.warn(`User not found: ${identifier}`);
      return null;
    }

    const isPasswordValid = md5(password) === user.password;
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${identifier}`);
      return null;
    }

    this.logger.log(`User validated successfully: ${user.username}`);
    return user;
  }

  async login(loginDto: LoginDto) {
    const identifier = loginDto.username || loginDto.email;
    if (!identifier) {
      throw new UnauthorizedException('Username or email is required');
    }

    const user = await this.validateUser(identifier, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.userRepository.save(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Encrypt password
    const hashedPassword = md5(registerDto.password);

    // Create user
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const tokens = await this.generateTokens(savedUser);

    // Save refresh token
    savedUser.refreshToken = tokens.refreshToken;
    savedUser.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.userRepository.save(savedUser);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.refreshTokenExpires && user.refreshTokenExpires < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const tokens = await this.generateTokens(user);

      // Update refresh token
      user.refreshToken = tokens.refreshToken;
      user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await this.userRepository.save(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.refreshToken = null;
    user.refreshTokenExpires = null;
    await this.userRepository.save(user);

    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate old password
    const isPasswordValid = md5(changePasswordDto.oldPassword) === user.password;
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    // Encrypt new password
    user.password = md5(changePasswordDto.newPassword);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'avatar', 'isActive', 'createdAt', 'lastLoginAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '7d') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
