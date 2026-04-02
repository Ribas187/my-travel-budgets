import { IsEmail } from 'class-validator';

export class RequestLoginPinDto {
  @IsEmail()
  email!: string;
}
