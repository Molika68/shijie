import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty()
  email: string;
}
