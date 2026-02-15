import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({ email, password_hash: hash });
    const saved = await this.userRepo.save(user);
    const { password_hash, totp_secret, ...safe } = saved as any;
    return safe;
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.userRepo.findOne({ where: { email, is_active: true } });
    if (!user || !user.password_hash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async issueTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwt.sign(payload),
      refresh_token: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.userRepo.findOne({ where: { id: payload.sub, is_active: true } });
    if (!user) throw new UnauthorizedException('User not found or inactive');
    return this.issueTokens(user);
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: payload.sub, is_active: true } });
  }
}
