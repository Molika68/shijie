import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async sendCode(email: string) {
    const normalized = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailVerification.deleteMany({
      where: { email: normalized },
    });
    await this.prisma.emailVerification.create({
      data: { email: normalized, code, expiresAt },
    });

    await this.email.sendVerificationCode(normalized, code);

    const isDev = !this.config.get('RESEND_API_KEY');
    return {
      code: 200,
      data: {
        message: isDev
          ? '验证码已生成（开发模式请查看后端控制台）'
          : '验证码已发送到邮箱',
        devCode: isDev ? code : undefined,
      },
    };
  }

  async login(email: string, code: string) {
    const normalized = email.trim().toLowerCase();
    const record = await this.prisma.emailVerification.findFirst({
      where: {
        email: normalized,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedException('验证码无效或已过期');
    }

    await this.prisma.emailVerification.deleteMany({
      where: { email: normalized },
    });

    let user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: normalized },
      });
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, { expiresIn: '30d' });

    return {
      userId: user.id,
      email: user.email,
      token,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }
      const token = this.jwt.sign({ sub: user.id, email: user.email });
      return { token, userId: user.id, email: user.email };
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }

  async getUserByToken(token: string) {
    try {
      const payload = this.jwt.verify(token) as { sub: string };
      return this.prisma.user.findUnique({ where: { id: payload.sub } });
    } catch {
      return null;
    }
  }

  async logout(_token: string) {
    return { success: true };
  }
}
