import {
  IsDateString,
  IsIn,
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
} from 'class-validator';
import { SUPPORTED_CURRENCIES } from '@repo/core';

const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

@ValidatorConstraint({ name: 'isStartDateBeforeEndDate', async: false })
class IsStartDateBeforeEndDate implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startDate?: string; endDate?: string };
    if (!obj.startDate || !obj.endDate) return true;
    return new Date(obj.startDate) <= new Date(obj.endDate);
  }

  defaultMessage(): string {
    return 'startDate must be before or equal to endDate';
  }
}

export class CreateTravelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsString()
  @IsIn(SUPPORTED_CURRENCY_CODES)
  currency!: string;

  @IsNumber()
  @IsPositive()
  budget!: number;

  @IsDateString()
  @Validate(IsStartDateBeforeEndDate)
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
