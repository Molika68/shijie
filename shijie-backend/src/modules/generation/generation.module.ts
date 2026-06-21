import { Module } from '@nestjs/common';
import { AiClientModule } from '../../common/ai-client.module';
import { AuthModule } from '../auth/auth.module';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';

@Module({
  imports: [AiClientModule, AuthModule],
  controllers: [GenerationController],
  providers: [GenerationService],
})
export class GenerationModule {}
