import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const resendKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get('EMAIL_FROM', '识界 <onboarding@resend.dev>');

    if (!resendKey) {
      this.logger.warn(`[开发模式] ${email} 验证码: ${code}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: '识界登录验证码',
        html: `<p>您的验证码是 <strong>${code}</strong>，10 分钟内有效。</p><p>如非本人操作，请忽略此邮件。</p>`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`邮件发送失败: ${detail}`);
      throw new Error('验证码发送失败，请稍后重试');
    }
  }
}
