import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyLoginPinDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pin!: string;
}
