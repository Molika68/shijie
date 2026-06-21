import { Body, Controller, Post } from '@nestjs/common';
import { TtsService } from './tts.service';
import { SpeakDto } from './dto/speak.dto';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post('speak')
  speak(@Body() dto: SpeakDto) {
    return this.ttsService.speak(dto);
  }
}
