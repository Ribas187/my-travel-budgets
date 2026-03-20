import { IsNotEmpty, IsString } from 'class-validator'

export class VerifyMagicLinkQueryDto {
  @IsString()
  @IsNotEmpty()
  token!: string
}
