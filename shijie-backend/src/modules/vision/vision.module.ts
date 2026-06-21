import { Module } from '@nestjs/common';
import { AiClientModule } from '../../common/ai-client.module';
import { AuthModule } from '../auth/auth.module';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';

@Module({
  imports: [AiClientModule, AuthModule],
  controllers: [VisionController],
  providers: [VisionService],
})
export class VisionModule {}
