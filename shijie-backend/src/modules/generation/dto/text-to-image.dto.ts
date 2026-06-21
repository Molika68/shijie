import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TextToImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt: string;
}
