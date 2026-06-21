import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SpeakDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}
