import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiClientModule } from './common/ai-client.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { VisionModule } from './modules/vision/vision.module';
import { GenerationModule } from './modules/generation/generation.module';
import { HistoryModule } from './modules/history/history.module';
import { UploadModule } from './modules/upload/upload.module';
import { TtsModule } from './modules/tts/tts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AiClientModule,
    PrismaModule,
    AuthModule,
    VisionModule,
    GenerationModule,
    HistoryModule,
    UploadModule,
    TtsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
