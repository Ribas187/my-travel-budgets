import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator'

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  icon?: string

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
    message: 'color must be a valid hex color (e.g. #FFF or #FF0000)',
  })
  color?: string

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budgetLimit?: number | null
}
