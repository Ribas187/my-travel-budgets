import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

export class CreateExpenseDto {
  @IsUUID()
  categoryId!: string

  @IsNumber()
  @IsPositive()
  amount!: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string

  @IsDateString()
  date!: string
}
