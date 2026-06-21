import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '验证码为 6 位数字' })
  @Matches(/^\d{6}$/, { message: '验证码为 6 位数字' })
  code: string;
}
