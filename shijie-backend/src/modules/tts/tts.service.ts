import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeakDto } from './dto/speak.dto';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly config: ConfigService) {}

  async speak(dto: SpeakDto) {
    const apiKey = this.config.get<string>('DASHSCOPE_API_KEY');

    if (!apiKey) {
      return {
        code: 200,
        data: {
          mock: true,
          message: '开发模式：请在前端使用 Taro 语音合成或 Web Speech API',
          text: dto.text,
        },
      };
    }

    const model = this.config.get('DASHSCOPE_TTS_MODEL', 'qwen3-tts-flash');
    const voice = this.config.get('DASHSCOPE_TTS_VOICE', 'Cherry');

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
            text: dto.text,
            voice,
            language_type: 'Chinese',
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      this.logger.warn(`TTS failed: ${response.status} ${errText}`);
      return {
        code: 200,
        data: {
          mock: true,
          message: '语音合成暂不可用，请使用前端朗读',
          text: dto.text,
        },
      };
    }

    const data = await response.json();
    const audioUrl = data?.output?.audio?.url;

    return {
      code: 200,
      data: { audioUrl, text: dto.text },
    };
  }
}
