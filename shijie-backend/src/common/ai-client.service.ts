import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RecognitionResult {
  object: string;
  description: string;
  english: string;
  mock?: boolean;
}

type AiProvider = 'mock' | 'gemini' | 'dashscope';

@Injectable()
export class AiClientService {
  private dailyCount = 0;
  private lastResetDate = new Date().toDateString();

  constructor(private readonly config: ConfigService) {}

  getProvider(): AiProvider {
    return this.getProviderInternal();
  }

  isMockMode(): boolean {
    return this.getProviderInternal() === 'mock';
  }

  private getProviderInternal(): AiProvider {
    const configured = this.config.get<string>('AI_PROVIDER', 'dashscope').toLowerCase();

    if (configured === 'mock') {
      return 'mock';
    }
    if (configured === 'dashscope' && this.config.get('DASHSCOPE_API_KEY')) {
      return 'dashscope';
    }
    if (configured === 'gemini' && this.config.get('GEMINI_API_KEY')) {
      return 'gemini';
    }
    if (this.config.get('DASHSCOPE_API_KEY')) {
      return 'dashscope';
    }
    if (this.config.get('GEMINI_API_KEY')) {
      return 'gemini';
    }
    return 'mock';
  }

  private checkRateLimit() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCount = 0;
      this.lastResetDate = today;
    }
    const limit = Number(this.config.get('AI_DAILY_LIMIT', 50));
    if (this.dailyCount >= limit) {
      throw new Error('今日 AI 调用次数已达上限，请明天再试');
    }
    this.dailyCount += 1;
  }

  async recognizeImage(imageBase64: string): Promise<RecognitionResult> {
    this.checkRateLimit();
    const provider = this.getProviderInternal();

    if (provider === 'mock') {
      return {
        object: '演示模式',
        description:
          '当前未配置 AI 密钥，所有图片都会返回此演示结果，并非真实识别。请在 shijie-backend/.env 中设置 AI_PROVIDER=dashscope 和 DASHSCOPE_API_KEY（阿里云 DashScope 控制台申请）后重启后端。',
        english: 'Demo Mode',
        mock: true,
      };
    }

    if (provider === 'gemini') {
      return this.recognizeWithGemini(imageBase64);
    }

    return this.recognizeWithDashscope(imageBase64);
  }

  async generateImage(prompt: string): Promise<string> {
    this.checkRateLimit();
    const provider = this.getProviderInternal();

    if (provider === 'mock') {
      return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 20))}/512/512`;
    }

    if (provider === 'gemini') {
      return this.generateWithPollinations(prompt);
    }

    return this.generateWithDashscope(prompt);
  }

  private async recognizeWithGemini(imageBase64: string): Promise<RecognitionResult> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')!;
    const model = this.config.get('GEMINI_MODEL', 'gemini-2.0-flash');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
                  text: '请识别这张图片中的主要物体，用 JSON 格式返回：{"object":"中文名称","description":"100字以内百科简介","english":"英文名称"}，只返回 JSON，不要其他内容。',
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error('识别服务繁忙，请稍后重试');
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return this.parseRecognition(text);
  }

  private async recognizeWithDashscope(imageBase64: string): Promise<RecognitionResult> {
    const apiKey = this.config.get<string>('DASHSCOPE_API_KEY')!;
    const model = this.config.get('DASHSCOPE_VISION_MODEL', 'qwen-vl-plus');
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: `data:image/jpeg;base64,${imageBase64}` },
                  {
                    text: '请仔细观察图片，识别其中最突出的主体（动物、植物、物品、建筑等）。用 JSON 格式返回：{"object":"中文名称","description":"100字以内百科简介","english":"英文名称"}。只返回 JSON，不要其他内容。',
                  },
                ],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await this.readDashscopeError(response, '识别'));
    }

    const data = await response.json();
    const text: string =
      data?.output?.choices?.[0]?.message?.content?.[0]?.text ??
      data?.output?.text ??
      '';

    return this.parseRecognition(text);
  }

  /** Pollinations.ai 免费文生图，无需 API Key */
  private generateWithPollinations(prompt: string): string {
    const encoded = encodeURIComponent(`${prompt}, high quality, detailed`);
    return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true`;
  }

  private async generateWithDashscope(prompt: string): Promise<string> {
    const apiKey = this.config.get<string>('DASHSCOPE_API_KEY')!;
    const model = this.config.get('DASHSCOPE_IMAGE_MODEL', 'wan2.7-image-pro');

    if (model === 'wanx-v1') {
      return this.generateWithWanxV1(prompt, apiKey);
    }

    return this.generateWithWan27(prompt, apiKey, model);
  }

  private async generateWithWan27(
    prompt: string,
    apiKey: string,
    model: string,
  ): Promise<string> {
    const size = this.config.get('DASHSCOPE_IMAGE_SIZE', '1K');
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: {
            messages: [
              {
                role: 'user',
                content: [{ text: prompt }],
              },
            ],
          },
          parameters: {
            size,
            n: 1,
            watermark: false,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await this.readDashscopeError(response, '图片生成'));
    }

    const data = await response.json();
    const imageUrl =
      data?.output?.choices?.[0]?.message?.content?.find(
        (item: { type?: string; image?: string }) => item?.image,
      )?.image ??
      data?.output?.choices?.[0]?.message?.content?.[0]?.image;

    if (!imageUrl) {
      throw new Error('图片生成失败：未返回图片地址');
    }

    return imageUrl;
  }

  private async generateWithWanxV1(prompt: string, apiKey: string): Promise<string> {
    const createRes = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: { prompt },
          parameters: { size: '512*512', n: 1 },
        }),
      },
    );

    if (!createRes.ok) {
      throw new Error(await this.readDashscopeError(createRes, '图片生成'));
    }

    const createData = await createRes.json();
    const taskId = createData?.output?.task_id;
    if (!taskId) {
      throw new Error('图片生成失败，请稍后重试');
    }

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      const statusData = await statusRes.json();
      if (statusData?.output?.task_status === 'SUCCEEDED') {
        return statusData.output.results[0].url;
      }
      if (statusData?.output?.task_status === 'FAILED') {
        throw new Error('图片生成失败，请稍后重试');
      }
    }

    throw new Error('图片生成超时，请稍后重试');
  }

  private async readDashscopeError(
    response: Response,
    action: string,
  ): Promise<string> {
    try {
      const data = await response.json();
      const message = data?.message || data?.error?.message;
      if (message) {
        return `${action}失败：${message}`;
      }
    } catch {
      // ignore parse errors
    }
    return `${action}服务繁忙，请稍后重试（${response.status}）`;
  }

  private parseRecognition(text: string): RecognitionResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // fallback below
    }
    return {
      object: '未知物体',
      description: text || '暂无描述',
      english: 'Unknown',
    };
  }
}
