import { Injectable } from '@nestjs/common';
import { AiClientService } from './common/ai-client.service';

@Injectable()
export class AppService {
  constructor(private readonly ai: AiClientService) {}

  getHealth() {
    return {
      code: 200,
      data: {
        status: 'ok',
        service: 'shijie-api',
        timestamp: new Date().toISOString(),
      },
    };
  }

  getConfig() {
    const provider = this.ai.getProvider();
    return {
      code: 200,
      data: {
        aiProvider: provider,
        aiMock: provider === 'mock',
        hint:
          provider === 'mock'
            ? '当前为演示模式，识物结果不准确。请配置 DASHSCOPE_API_KEY 启用通义千问 VL。'
            : undefined,
      },
    };
  }
}
