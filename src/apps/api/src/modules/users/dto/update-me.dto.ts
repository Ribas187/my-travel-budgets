import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  avatarUrl?: string
}
