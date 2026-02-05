import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

/**
 * Token Payload Interface
 */
export interface TokenPayload {
  sub: string; // User ID
  username: string;
  email?: string;
  type?: 'access' | 'refresh' | 'reset';
  jti?: string; // Token ID (for revocation)
  iat?: number; // Issued At (JWT standard)
  exp?: number; // Expiration Time (JWT standard)
}

/**
 * Token Pair Interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Token Validation Result Interface
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  expired?: boolean;
  error?: string;
}

/**
 * JWT Token Utility Class
 * Provides Token generation, validation, refresh and other features
 */
@Injectable()
export class TokenUtil {
  private readonly logger = new Logger(TokenUtil.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generate Access Token
   *
   * @param payload - Token payload
   * @param expiresIn - Expiration time (e.g., '7d', '24h')
   * @returns Promise<string>
   */
  async generateAccessToken(
    payload: Omit<TokenPayload, 'type'>,
    expiresIn: string = process.env.JWT_EXPIRES_IN || '7d',
  ): Promise<string> {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'access',
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(tokenPayload as any, { expiresIn: expiresIn } as any);
  }

  /**
   * Generate Refresh Token
   *
   * @param payload - Token payload
   * @param expiresIn - Expiration time (e.g., '30d')
   * @returns Promise<string>
   */
  async generateRefreshToken(
    payload: Omit<TokenPayload, 'type'>,
    expiresIn: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  ): Promise<string> {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'refresh',
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(tokenPayload as any, { expiresIn: expiresIn } as any);
  }

  /**
   * Generate Token Pair (Access Token + Refresh Token)
   *
   * @param payload - Token payload
   * @returns Promise<TokenPair>
   */
  async generateTokenPair(payload: Omit<TokenPayload, 'type'>): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    const decoded = this.jwtService.decode(accessToken) as any;
    const expiresIn = decoded?.exp || Math.floor(Date.now() / 1000) + 7 * 24 * 3600;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Generate Password Reset Token
   *
   * @param payload - Token payload
   * @param expiresIn - Expiration time (default: 1 hour)
   * @returns Promise<string>
   */
  async generateResetToken(
    payload: Omit<TokenPayload, 'type'>,
    expiresIn: string = '1h',
  ): Promise<string> {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'reset',
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(tokenPayload as any, { expiresIn: expiresIn } as any);
  }

  /**
   * Validate Token
   *
   * @param token - Token string
   * @returns Promise<TokenValidationResult>
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error.message}`);

      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          expired: true,
          error: 'Token has expired',
        };
      }

      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Decode Token (without verifying signature)
   *
   * @param token - Token string
   * @returns TokenPayload | null
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.decode<TokenPayload>(token);
    } catch (error) {
      this.logger.error(`Token decode failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Refresh Token Pair
   *
   * @param refreshToken - Refresh token string
   * @returns Promise<TokenPair | null>
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    const validationResult = await this.validateToken(refreshToken);

    if (!validationResult.valid || validationResult.expired) {
      this.logger.warn('Refresh token validation failed');
      return null;
    }

    const payload = validationResult.payload!;

    // Check if token type is refresh
    if (payload.type !== 'refresh') {
      this.logger.warn('Invalid token type for refresh');
      return null;
    }

    // Generate new token pair
    const { type, jti, ...userPayload } = payload;
    return this.generateTokenPair(userPayload);
  }

  /**
   * Extract Token from Authorization Header
   *
   * @param authHeader - Authorization header value
   * @returns Token string or null
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Calculate Token Remaining Time
   *
   * @param token - Token string
   * @returns Remaining seconds, -1 for expired, -2 for invalid
   */
  getTokenRemainingTime(token: string): number {
    const decoded = this.decodeToken(token);

    if (!decoded || !decoded.exp) {
      return -2; // Invalid Token
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;

    return remaining > 0 ? remaining : -1; // -1 means expired
  }

  /**
   * Check if Token is Expiring Soon
   *
   * @param token - Token string
   * @param thresholdSeconds - Threshold in seconds (default: 5 minutes)
   * @returns boolean
   */
  isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
    const remaining = this.getTokenRemainingTime(token);

    return remaining > 0 && remaining <= thresholdSeconds;
  }

  /**
   * Generate Temporary Token (for short-term verification)
   *
   * @param payload - Token payload
   * @param expiresIn - Expiration time (default: 15 minutes)
   * @returns Promise<string>
   */
  async generateTemporaryToken(
    payload: Omit<TokenPayload, 'type'>,
    expiresIn: string = '15m',
  ): Promise<string> {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'access',
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(tokenPayload as any, { expiresIn: expiresIn } as any);
  }

  /**
   * Batch Validate Tokens
   *
   * @param tokens - Token array
   * @returns Promise<TokenValidationResult[]>
   */
  async validateTokens(tokens: string[]): Promise<TokenValidationResult[]> {
    return Promise.all(tokens.map(token => this.validateToken(token)));
  }

  /**
   * Revoke Token (add to blacklist)
   *
   * @param token - Token to revoke
   * @param reason - Revocation reason
   * @returns Promise<boolean>
   */
  async revokeToken(token: string, reason?: string): Promise<boolean> {
    const payload = this.decodeToken(token);

    if (!payload) {
      return false;
    }

    // TODO: Add token to blacklist (e.g., Redis)
    // Example implementation:
    // await this.redisService.setex(
    //   `revoked:${payload.jti}`,
    //   this.getTokenRemainingTime(token),
    //   JSON.stringify({ reason, revokedAt: new Date() })
    // );

    this.logger.log(`Token revoked: ${payload.jti}, reason: ${reason || 'unknown'}`);
    return true;
  }

  /**
   * Check if Token is Revoked
   *
   * @param token - Token string
   * @returns Promise<boolean>
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const payload = this.decodeToken(token);

    if (!payload || !payload.jti) {
      return false;
    }

    // TODO: Check blacklist (e.g., Redis)
    // Example implementation:
    // const revoked = await this.redisService.get(`revoked:${payload.jti}`);
    // return !!revoked;

    return false;
  }

  /**
   * Get Token Metadata
   *
   * @param token - Token string
   * @returns Token metadata
   */
  getTokenMetadata(token: string): {
    issuedAt: number;
    expiresAt: number;
    remainingTime: number;
    isExpired: boolean;
  } | null {
    const decoded = this.decodeToken(token);

    if (!decoded) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const issuedAt = decoded.iat || now;
    const expiresAt = decoded.exp || now + 3600;
    const remainingTime = Math.max(0, expiresAt - now);

    return {
      issuedAt,
      expiresAt,
      remainingTime,
      isExpired: remainingTime === 0,
    };
  }

  /**
   * Format Token Duration to Human Readable Format
   *
   * @param seconds - Seconds
   * @returns Formatted string
   */
  formatTokenDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hours`;
    }

    const days = Math.floor(hours / 24);
    return `${days} days`;
  }

  /**
   * Static Method: Verify JWT Token (without dependency injection)
   *
   * @param token - Token string
   * @param secret - Secret key
   * @returns TokenPayload | null
   */
  static verifyTokenStatic(token: string, secret: string): TokenPayload | null {
    try {
      const jwt = require('jsonwebtoken');
      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Static Method: Generate JWT Token (without dependency injection)
   *
   * @param payload - Token payload
   * @param secret - Secret key
   * @param expiresIn - Expiration time
   * @returns Token string
   */
  static generateTokenStatic(
    payload: TokenPayload,
    secret: string,
    expiresIn: string,
  ): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret, { expiresIn });
  }
}
