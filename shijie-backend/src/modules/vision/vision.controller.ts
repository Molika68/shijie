import {
  Controller,
  Headers,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisionService } from './vision.service';

@Controller('vision')
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('recognize')
  @UseInterceptors(FileInterceptor('image'))
  async recognize(
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') auth?: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.visionService.recognize(file, token);
  }
}
