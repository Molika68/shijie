import {
  BadRequestException,
  Headers,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AiClientService } from '../../common/ai-client.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class VisionService {
  constructor(
    private readonly ai: AiClientService,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly upload: UploadService,
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

  async recognize(file: Express.Multer.File, token?: string) {
    if (!file) {
      throw new BadRequestException('请上传图片');
    }

    const userId = await this.resolveUserId(token);
    const imageUrl = await this.upload.saveFile(file);

    try {
      const result = await this.ai.recognizeImage(file.buffer.toString('base64'));
      const outputText = JSON.stringify(result);

      await this.prisma.history.create({
        data: {
          userId,
          type: 'RECOGNITION',
          inputImage: imageUrl,
          outputText,
        },
      });

      return { code: 200, data: result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '识别服务繁忙，请稍后重试';
      throw new BadRequestException(message);
    }
  }
}
