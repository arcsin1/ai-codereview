import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    this.logger.log(`Attempting login for username: ${username}`);

    // Support login by username or email
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      this.logger.warn(`Login failed for username: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Login successful for user: ${user.username}`);
    return user;
  }
}
