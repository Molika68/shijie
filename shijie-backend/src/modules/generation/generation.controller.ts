import { Body, Controller, Headers, Post } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { TextToImageDto } from './dto/text-to-image.dto';

@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post('text-to-image')
  async textToImage(
    @Body() dto: TextToImageDto,
    @Headers('authorization') auth?: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.generationService.textToImage(dto, token);
  }
}
