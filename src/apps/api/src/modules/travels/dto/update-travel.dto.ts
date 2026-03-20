import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator'

@ValidatorConstraint({ name: 'isUpdateStartDateBeforeEndDate', async: false })
class IsUpdateStartDateBeforeEndDate implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startDate?: string; endDate?: string }
    if (!obj.startDate || !obj.endDate) return true
    return new Date(obj.startDate) <= new Date(obj.endDate)
  }

  defaultMessage(): string {
    return 'startDate must be before or equal to endDate'
  }
}

export class UpdateTravelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budget?: number

  @IsOptional()
  @IsDateString()
  @Validate(IsUpdateStartDateBeforeEndDate)
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}
