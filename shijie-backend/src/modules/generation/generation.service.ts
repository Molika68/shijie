import {
  BadRequestException,
  Body,
  Headers,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AiClientService } from '../../common/ai-client.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { TextToImageDto } from './dto/text-to-image.dto';

@Injectable()
export class GenerationService {
  constructor(
    private readonly ai: AiClientService,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private async resolveUserId(token?: string) {
    if (!token) {
      throw new UnauthorizedException('请先登录');
    }
    const user = await this.auth.getUserByToken(token);
    if (!user) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    return user.id;
  }

  async textToImage(dto: TextToImageDto, token?: string) {
    const userId = await this.resolveUserId(token);

    try {
      const imageUrl = await this.ai.generateImage(dto.prompt);

      await this.prisma.history.create({
        data: {
          userId,
          type: 'GENERATION',
          inputText: dto.prompt,
          outputImage: imageUrl,
        },
      });

      return { code: 200, data: { imageUrl } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '图片生成服务繁忙，请稍后重试';
      throw new BadRequestException(message);
    }
  }
}
