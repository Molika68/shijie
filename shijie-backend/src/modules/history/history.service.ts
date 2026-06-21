import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class HistoryService {
  constructor(
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

  async list(token: string | undefined, page = 1, size = 20, type?: string) {
    const userId = await this.resolveUserId(token);
    const skip = (page - 1) * size;

    const where: { userId: string; type?: string } = { userId };
    if (type) {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      this.prisma.history.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.history.count({ where }),
    ]);

    return {
      code: 200,
      data: {
        items: items.map((item) => this.formatHistory(item)),
        total,
        page,
        size,
      },
    };
  }

  async getById(id: string, token?: string) {
    const userId = await this.resolveUserId(token);
    const item = await this.prisma.history.findFirst({
      where: { id, userId },
    });
    if (!item) {
      throw new NotFoundException('记录不存在');
    }
    return { code: 200, data: this.formatHistory(item) };
  }

  async remove(id: string, token?: string) {
    const userId = await this.resolveUserId(token);
    const item = await this.prisma.history.findFirst({
      where: { id, userId },
    });
    if (!item) {
      throw new NotFoundException('记录不存在');
    }
    await this.prisma.history.delete({ where: { id } });
    return { code: 200, data: { success: true } };
  }

  private formatHistory(item: {
    id: string;
    type: string;
    inputText: string | null;
    inputImage: string | null;
    outputText: string | null;
    outputImage: string | null;
    createdAt: Date;
  }) {
    let recognition: Record<string, string> | null = null;
    if (item.type === 'RECOGNITION' && item.outputText) {
      try {
        recognition = JSON.parse(item.outputText);
      } catch {
        recognition = { description: item.outputText };
      }
    }

    return {
      id: item.id,
      type: item.type,
      inputText: item.inputText,
      inputImage: item.inputImage,
      outputText: item.outputText,
      outputImage: item.outputImage,
      recognition,
      createdAt: item.createdAt,
    };
  }
}
